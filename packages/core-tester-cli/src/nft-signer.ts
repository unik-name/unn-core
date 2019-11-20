import { Transactions } from "@arkecosystem/crypto";
import { NftBuilderFactory, NftTransactions } from "@uns/core-nft-crypto";
import { Signer } from "./signer";

export class NftSigner extends Signer {
    public makeNftUpdate(opts: Record<string, any>): any {
        return this.makeAbstractNftUpdate(opts, NftBuilderFactory.nftUpdate);
    }

    public makeNftMint(opts: Record<string, any>): any {
        Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NFTMintTransaction);
        if (!opts.properties || !opts.properties.type) {
            opts.properties = { ...opts.properties, type: "1" };
        }
        return this.makeAbstractNftUpdate(opts, NftBuilderFactory.nftMint);
    }
    private makeAbstractNftUpdate(opts: Record<string, any>, builder): any {
        const transaction = builder(opts.id)
            .properties(opts.properties)
            .fee(this.toSatoshi(opts.nftFee))
            .network(this.network)
            .nonce(this.nonce.toString())
            .sign(opts.passphrase);

        if (opts.secondPassphrase) {
            transaction.secondSign(opts.secondPassphrase);
        }

        return transaction.getStruct();
    }
}
