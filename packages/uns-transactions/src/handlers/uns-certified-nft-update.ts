import { State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
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

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.throwIfCannotBeApplied(transaction, wallet, walletManager);

        await this.throwIfCannotBeCertified(transaction, walletManager);
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
