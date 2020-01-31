import { State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler } from "@uns/core-nft";
import {
    applyMixins,
    CertifiedNftMintTransaction,
    ICertificationable,
    INftDemand,
    NftMintDemandCertificationSigner,
    NftMintDemandHashBuffer,
} from "@uns/crypto";
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

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.throwIfCannotBeApplied(transaction, wallet, walletManager);

        await this.throwIfCannotBeCertified(transaction, walletManager);
    }

    protected getPayloadSigner(payload: ICertificationable): NftMintDemandCertificationSigner {
        return new NftMintDemandCertificationSigner(payload);
    }

    protected getPayloadHashBuffer(demand: INftDemand): NftMintDemandHashBuffer {
        return new NftMintDemandHashBuffer(demand);
    }
}

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface CertifiedNftMintTransactionHandler extends NftMintTransactionHandler, CertifiedTransactionHandler {}
applyMixins(CertifiedNftMintTransactionHandler, [CertifiedTransactionHandler]);
