import { Database, State } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftUpdateTransactionHandler } from "@uns/core-nft";
import {
    applyMixins,
    CertifiedNftUpdateTransaction,
    INftDemand,
    INftUpdateDemandCertificationPayload,
    NftUpdateDemandCertificationSigner,
    NftUpdateDemandHashBuffer,
} from "@uns/crypto";
import { CertifiedTransactionHandler } from "./uns-certified-handler";

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
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.applyCostToRecipient(transaction.data, walletManager);
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        this.revertCostToRecipient(transaction, walletManager);
    }

    protected getPayloadSigner(payload: INftUpdateDemandCertificationPayload): NftUpdateDemandCertificationSigner {
        return new NftUpdateDemandCertificationSigner(payload);
    }

    protected getPayloadHashBuffer(demand: INftDemand): NftUpdateDemandHashBuffer {
        return new NftUpdateDemandHashBuffer(demand);
    }
}

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface CertifiedNftUpdateTransactionHandler
    extends NftUpdateTransactionHandler,
        CertifiedTransactionHandler {}
applyMixins(CertifiedNftUpdateTransactionHandler, [CertifiedTransactionHandler]);
