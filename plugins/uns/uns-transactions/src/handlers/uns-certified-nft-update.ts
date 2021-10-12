import { Database, State } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { NftUpdateTransactionHandler } from "@uns/core-nft";
import { getCurrentNftAsset, getTokenId } from "@uns/core-nft-crypto";
import {
    applyMixins,
    CertifiedNftUpdateTransaction,
    DIDTypes,
    getRewardsFromDidType,
    isAliveDemand,
} from "@uns/crypto";
import { getNftsManager } from ".";
import { CertifiedTransactionHandler } from "./uns-certified-handler";
import { throwIfInvalidAmount, throwIfInvalidFee } from "./utils";

export class CertifiedNftUpdateTransactionHandler extends NftUpdateTransactionHandler {
    public async isActivated(): Promise<boolean> {
        return true;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NftUpdateTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return CertifiedNftUpdateTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                this.applyCostToRecipient(transaction, walletManager);

                // uns token eco v2
                if (
                    Managers.configManager.getMilestone(transaction.blockHeight).unsTokenEcoV2 &&
                    isAliveDemand(transaction.asset)
                ) {
                    const sender: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                    const tokenId = getTokenId(transaction.asset);
                    const didType = sender.getAttribute("tokens")[tokenId].type;
                    if (didType === DIDTypes.INDIVIDUAL) {
                        this.applyRewardsToFoundation(walletManager, didType, transaction.blockHeight);
                        const rewards = getRewardsFromDidType(didType, transaction.blockHeight);
                        // fee will be deduced in wallets state generation
                        sender.balance = sender.balance
                            .plus(transaction.fee)
                            .plus(Utils.BigNumber.make(rewards.sender));
                    }
                }

                // Save changes in database
                const asset = getCurrentNftAsset(transaction.asset);
                if (asset.properties) {
                    await getNftsManager().manageProperties(asset.properties, asset.tokenId);
                }
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.throwIfCannotBeApplied(transaction, wallet, walletManager);

        await this.throwIfCannotBeCertified(transaction, walletManager);
        if (isAliveDemand(transaction.data.asset) && Managers.configManager.getMilestone().unsTokenEcoV2) {
            const tokenId = getTokenId(transaction.data.asset);
            const didType = wallet.getAttribute("tokens")[tokenId].type;

            if (didType === DIDTypes.INDIVIDUAL) {
                throwIfInvalidAmount(transaction);
                const rewards = getRewardsFromDidType(didType);
                // Fees should be equal to forger reward
                throwIfInvalidFee(transaction, Utils.BigNumber.make(rewards.forger));
            }
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.applyCostToRecipient(transaction.data, walletManager);
        if (isAliveDemand(transaction.data.asset) && Managers.configManager.getMilestone().unsTokenEcoV2) {
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            const tokenId = getTokenId(transaction.data.asset);
            const didType = sender.getAttribute("tokens")[tokenId].type;
            // voucher token eco for Individuals only
            if (didType === DIDTypes.INDIVIDUAL) {
                this.applyRewardsToFoundation(walletManager, didType);
            }
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        if (isAliveDemand(transaction.data.asset) && Managers.configManager.getMilestone().unsTokenEcoV2) {
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            const tokenId = getTokenId(transaction.data.asset);
            const didType = sender.getAttribute("tokens")[tokenId].type;
            // voucher token eco for Individuals only
            if (didType === DIDTypes.INDIVIDUAL) {
                // fee will be deduced in super.applyToSender
                const rewards = getRewardsFromDidType(didType);
                sender.balance = sender.balance.plus(transaction.data.fee).plus(Utils.BigNumber.make(rewards.sender));
            }
        }

        await super.applyToSender(transaction, walletManager, updateDb);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.revertCostToRecipient(transaction, walletManager);
        if (isAliveDemand(transaction.data.asset) && Managers.configManager.getMilestone().unsTokenEcoV2) {
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            const tokenId = getTokenId(transaction.data.asset);
            const didType = sender.getAttribute("tokens")[tokenId].type;
            // voucher token eco for Individuals only
            if (didType === DIDTypes.INDIVIDUAL) {
                this.revertRewardsForFoundation(walletManager, didType);
            }
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        if (isAliveDemand(transaction.data.asset) && Managers.configManager.getMilestone().unsTokenEcoV2) {
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            const tokenId = getTokenId(transaction.data.asset);
            const didType = sender.getAttribute("tokens")[tokenId].type;
            // voucher token eco for Individuals only
            if (didType === DIDTypes.INDIVIDUAL) {
                const rewards = getRewardsFromDidType(didType);
                const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
                sender.balance = sender.balance.minus(transaction.data.fee).minus(Utils.BigNumber.make(rewards.sender));
            }
        }
        await super.revertForSender(transaction, walletManager, updateDb);
    }

    protected checkEmptyBalance(transaction: Interfaces.ITransaction, sender: State.IWallet): boolean {
        const tokenId = getTokenId(transaction.data.asset);
        const didType = sender.getAttribute("tokens")[tokenId].type;
        return !(
            didType === DIDTypes.INDIVIDUAL &&
            Managers.configManager.getMilestone().unsTokenEcoV2 &&
            isAliveDemand(transaction.data.asset)
        );
    }
}

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface CertifiedNftUpdateTransactionHandler
    extends NftUpdateTransactionHandler,
        CertifiedTransactionHandler {}
applyMixins(CertifiedNftUpdateTransactionHandler, [CertifiedTransactionHandler]);
