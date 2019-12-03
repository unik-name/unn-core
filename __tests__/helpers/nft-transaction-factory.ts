import { Builders } from "@uns/core-nft-crypto";
import { TransactionFactory } from "./transaction-factory";

export class NFTTransactionFactory extends TransactionFactory {
    public static nftMint(nftName: string, tokenId: string, properties) {
        return new TransactionFactory(new Builders.NftMintBuilder(nftName, tokenId).properties(properties));
    }

    public static nftUpdate(nftName: string, tokenId: string, properties) {
        return new TransactionFactory(new Builders.NftUpdateBuilder(nftName, tokenId).properties(properties));
    }

    public static nftTransfer(nftName: string, tokenId: string, recipient: string) {
        return new TransactionFactory(new Builders.NftTransferBuilder(nftName, tokenId).recipientId(recipient));
    }
}
