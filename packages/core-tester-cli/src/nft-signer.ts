import { Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { Signer } from "./signer";

export class NftSigner extends Signer {
    public makeNftUpdate(opts: Record<string, any>): any {
        Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftUpdateTransaction);
        return this.makeAbstractNftUpdate(opts, new Builders.NftUpdateBuilder(opts.nftName, opts.id));
    }

    public makeNftMint(opts: Record<string, any>): any {
        Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftMintTransaction);
        return this.makeAbstractNftUpdate(opts, new Builders.NftMintBuilder(opts.nftName, opts.id));
    }

    private makeAbstractNftUpdate(opts: Record<string, any>, builder): any {
        const transaction = builder
            .properties(opts.properties)
            .fee(this.nft_toSatoshi(opts.nftFee))
            .network(this.network)
            .nonce(this.nonce.toString())
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }

    private nft_toSatoshi(value): string {
        return Utils.BigNumber.make(value * 1e8).toFixed();
    }
}
