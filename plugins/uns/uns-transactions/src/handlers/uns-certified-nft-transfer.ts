import { Database, State } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftTransferTransactionHandler } from "@uns/core-nft";
import { applyMixins, CertifiedNftTransferTransaction, INftDemandPayload } from "@uns/crypto";
import * as Errors from "../errors";
import { CertifiedTransactionHandler } from "./uns-certified-handler";
import { CertifiedNftMintTransactionHandler } from "./uns-certified-nft-mint";
import { getUnikOwner } from "./utils";

export class CertifiedNftTransferTransactionHandler extends NftTransferTransactionHandler {
    public async isActivated(): Promise<boolean> {
        return this.isTransactionActivated();
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [CertifiedNftMintTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return CertifiedNftTransferTransaction;
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                this.applyCostToSender(transaction, walletManager);
                await this.applyCostToFactory(transaction, walletManager, transaction.blockHeight);
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

        const demandPayload: INftDemandPayload = transaction.data.asset.demand.payload;

        // assert sender corresponds to the demand sub
        if (transaction.data.senderPublicKey !== (await getUnikOwner(demandPayload.sub))) {
            throw new Errors.NftTransactionParametersError("sender");
        }

        // assert recipient corresponds to the recipient of certification
        if (transaction.data.recipientId !== demandPayload.cryptoAccountAddress) {
            throw new Errors.NftTransactionParametersError("recipient");
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await this.applyCostToFactory(transaction.data, walletManager);
        await super.applyToRecipient(transaction, walletManager);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        this.applyCostToSender(transaction.data, walletManager);
        await super.applyToSender(transaction, walletManager, updateDb);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await this.revertCostForFactory(transaction.data, walletManager);
        await super.revertForRecipient(transaction, walletManager);
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        this.revertCostForSender(transaction.data, walletManager);
        await super.revertForSender(transaction, walletManager, updateDb);
    }
}

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface CertifiedNftTransferTransactionHandler
    extends NftTransferTransactionHandler,
        CertifiedTransactionHandler {}
applyMixins(CertifiedNftTransferTransactionHandler, [CertifiedTransactionHandler]);
