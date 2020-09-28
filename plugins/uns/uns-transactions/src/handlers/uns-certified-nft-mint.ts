import { Database, State } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { IDynamicFeeContext } from "@arkecosystem/core-transactions/dist/interfaces";
import { Identities, Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { NftMintTransactionHandler, nftRepository } from "@uns/core-nft";
import { addNftToWallet } from "@uns/core-nft";
import { getCurrentNftAsset, getNftName } from "@uns/core-nft-crypto";
import {
    applyMixins,
    CertifiedNftMintTransaction,
    getVoucherRewards,
    hasVoucher,
    INftDemand,
    INftMintDemandCertificationPayload,
    NftMintDemandCertificationSigner,
    NftMintDemandHashBuffer,
} from "@uns/crypto";
import { VoucherAlreadyUsedError, WrongFeeError } from "../errors";
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
                await addNftToWallet(sender, transaction.asset, walletManager);

                this.applyCostToRecipient(transaction, walletManager);

                // uns former token eco
                if (
                    !Managers.configManager.getMilestone(transaction.blockHeight).unsTokenEcoV2 &&
                    hasVoucher(transaction.asset)
                ) {
                    const rewards = getVoucherRewards(transaction.asset);
                    const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
                    const foundationWallet: State.IWallet = walletManager.findByAddress(
                        Identities.Address.fromPublicKey(foundationPublicKey),
                    );

                    foundationWallet.balance = foundationWallet.balance.plus(rewards.foundation);

                    sender.balance = sender.balance
                        .plus(transaction.amount)
                        .plus(transaction.fee)
                        .plus(Utils.BigNumber.make(rewards.sender));
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

        if (hasVoucher(transaction.data.asset)) {
            if (Managers.configManager.getMilestone().unsTokenEcoV2) {
                if (!transaction.data.fee.isEqualTo(Utils.BigNumber.ZERO)) {
                    throw new WrongFeeError(transaction.data.id);
                }
            } else {
                // Fees should be equal to forger reward
                const rewards = getVoucherRewards(transaction.data.asset);
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
                transaction.typeGroup,
            );
            if (transactions.length) {
                throw new VoucherAlreadyUsedError(voucherId);
            }
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.applyCostToRecipient(transaction.data, walletManager);

        if (!Managers.configManager.getMilestone().unsTokenEcoV2 && hasVoucher(transaction.data.asset)) {
            // voucher token eco
            // pay Space Elephant Foundation
            const rewards = getVoucherRewards(transaction.data.asset);
            const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
            const foundationWallet: State.IWallet = walletManager.findByAddress(
                Identities.Address.fromPublicKey(foundationPublicKey),
            );
            foundationWallet.balance = foundationWallet.balance.plus(Utils.BigNumber.make(rewards.foundation));
        }
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        if (!Managers.configManager.getMilestone().unsTokenEcoV2 && hasVoucher(transaction.data.asset)) {
            // voucher token eco
            // fee and amount will be deduced in super.applyToSender
            const rewards = getVoucherRewards(transaction.data.asset);
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            sender.balance = sender.balance.plus(transaction.data.fee).plus(Utils.BigNumber.make(rewards.sender));
        }

        await super.applyToSender(transaction, walletManager, updateDb);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.revertCostToRecipient(transaction, walletManager);

        if (!Managers.configManager.getMilestone().unsTokenEcoV2 && hasVoucher(transaction.data.asset)) {
            const rewards = getVoucherRewards(transaction.data.asset);
            const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
            const foundationWallet: State.IWallet = walletManager.findByAddress(
                Identities.Address.fromPublicKey(foundationPublicKey),
            );
            foundationWallet.balance = foundationWallet.balance.minus(Utils.BigNumber.make(rewards.foundation));
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        if (!Managers.configManager.getMilestone().unsTokenEcoV2 && hasVoucher(transaction.data.asset)) {
            const rewards = getVoucherRewards(transaction.data.asset);
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            sender.balance = sender.balance.minus(transaction.data.fee).minus(Utils.BigNumber.make(rewards.sender));
        }
        await super.revertForSender(transaction, walletManager, updateDb);
    }

    // eslint-disable-next-line
    public dynamicFee(context: IDynamicFeeContext): Utils.BigNumber {
        if (!Managers.configManager.getMilestone(context.height).unsTokenEcoV2) {
            return super.dynamicFee(context);
        } else {
            return Utils.BigNumber.ZERO;
        }
    }

    protected getPayloadSigner(payload: INftMintDemandCertificationPayload): NftMintDemandCertificationSigner {
        return new NftMintDemandCertificationSigner(payload);
    }

    protected getPayloadHashBuffer(demand: INftDemand): NftMintDemandHashBuffer {
        return new NftMintDemandHashBuffer(demand);
    }

    protected checkEmptyBalance(transaction: Interfaces.ITransaction): boolean {
        return !Managers.configManager.getMilestone().unsTokenEcoV2 && !hasVoucher(transaction.data.asset);
    }
}

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface CertifiedNftMintTransactionHandler extends NftMintTransactionHandler, CertifiedTransactionHandler {}
applyMixins(CertifiedNftMintTransactionHandler, [CertifiedTransactionHandler]);
