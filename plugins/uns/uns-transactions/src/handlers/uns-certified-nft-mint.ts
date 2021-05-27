import { Database, State } from "@arkecosystem/core-interfaces";
import { Handlers, Interfaces as TrxInterfaces, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { NftMintTransactionHandler, nftRepository } from "@uns/core-nft";
import { addNftToWallet } from "@uns/core-nft";
import { getCurrentNftAsset, getNftName } from "@uns/core-nft-crypto";
import {
    applyMixins,
    CertifiedNftMintTransaction,
    DIDTypes,
    getDidType,
    getMintVoucherRewards,
    getRewardsFromDidType,
    hasVoucher,
    IUnsRewards,
} from "@uns/crypto";
import { VoucherAlreadyUsedError, WrongFeeError, WrongServiceCostError } from "../errors";
import { CertifiedTransactionHandler } from "./uns-certified-handler";

export class CertifiedNftMintTransactionHandler extends NftMintTransactionHandler {
    public async isActivated(): Promise<boolean> {
        return true;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NftMintTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return CertifiedNftMintTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const sender: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const { tokenId } = getCurrentNftAsset(transaction.asset);
                const didType = getDidType(transaction.asset);

                await addNftToWallet(sender, walletManager, tokenId, didType);
                this.applyCostToRecipient(transaction, walletManager);

                if (this.hasRewards(transaction.asset, transaction.blockHeight)) {
                    this.applyRewardsToFoundation(walletManager, didType, transaction.blockHeight);
                    const rewards: IUnsRewards = getRewardsFromDidType(didType, transaction.blockHeight);
                    // fee will be deduced in wallets state generation
                    sender.balance = sender.balance.plus(transaction.fee).plus(Utils.BigNumber.make(rewards.sender));
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

        const didType = getDidType(transaction.data.asset);
        if (hasVoucher(transaction.data.asset)) {
            if (!transaction.data.amount.isEqualTo(Utils.BigNumber.ZERO)) {
                throw new WrongServiceCostError(transaction.data.id);
            }
            if (Managers.configManager.getMilestone().unsTokenEcoV2 && didType === DIDTypes.INDIVIDUAL) {
                if (!transaction.data.fee.isEqualTo(Utils.BigNumber.ZERO)) {
                    throw new WrongFeeError(transaction.data.id);
                }
            } else {
                // Fees should be equal to forger reward
                const rewards: IUnsRewards = getRewardsFromDidType(didType);
                if (!transaction.data.fee.isEqualTo(Utils.BigNumber.make(rewards.forger))) {
                    throw new WrongFeeError(transaction.data.id);
                }
            }

            // Check voucher existence in DB
            const voucherId = getCurrentNftAsset(transaction.data.asset).properties.UnikVoucherId;
            const asset = {
                nft: { [getNftName(transaction.data.asset)]: { properties: { UnikVoucherId: voucherId } } },
            };
            const transactions = await nftRepository().findTransactionsByAsset(
                asset,
                [transaction.type],
                [transaction.typeGroup],
            );
            if (transactions?.length) {
                throw new VoucherAlreadyUsedError(voucherId);
            }
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.applyCostToRecipient(transaction.data, walletManager);

        if (this.hasRewards(transaction.data.asset)) {
            const didType = getDidType(transaction.data.asset);
            this.applyRewardsToFoundation(walletManager, didType);
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        if (this.hasRewards(transaction.data.asset)) {
            // voucher token eco
            const rewards: IUnsRewards = getMintVoucherRewards(transaction.data.asset);
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            // fee will be deduced in super.applyToSender
            sender.balance = sender.balance.plus(transaction.data.fee).plus(Utils.BigNumber.make(rewards.sender));
        }

        await super.applyToSender(transaction, walletManager, updateDb);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.revertCostToRecipient(transaction, walletManager);

        if (this.hasRewards(transaction.data.asset)) {
            const didType = getDidType(transaction.data.asset);
            this.revertRewardsForFoundation(walletManager, didType);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        if (this.hasRewards(transaction.data.asset)) {
            const rewards = getMintVoucherRewards(transaction.data.asset);
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            sender.balance = sender.balance.minus(transaction.data.fee).minus(Utils.BigNumber.make(rewards.sender));
        }
        await super.revertForSender(transaction, walletManager, updateDb);
    }

    public dynamicFee(context: TrxInterfaces.IDynamicFeeContext): Utils.BigNumber {
        const didType = getDidType(context.transaction.data.asset);
        if (Managers.configManager.getMilestone(context.height).unsTokenEcoV2 && didType === DIDTypes.INDIVIDUAL) {
            return Utils.BigNumber.ZERO;
        } else {
            return super.dynamicFee(context);
        }
    }

    protected checkEmptyBalance(transaction: Interfaces.ITransaction): boolean {
        return !hasVoucher(transaction.data.asset);
    }

    private hasRewards(asset: Interfaces.ITransactionAsset, height?: number): boolean {
        const didType = getDidType(asset);
        return (
            hasVoucher(asset) &&
            (!Managers.configManager.getMilestone(height).unsTokenEcoV2 || didType !== DIDTypes.INDIVIDUAL)
        );
    }
}

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface CertifiedNftMintTransactionHandler extends NftMintTransactionHandler, CertifiedTransactionHandler {}
applyMixins(CertifiedNftMintTransactionHandler, [CertifiedTransactionHandler]);
