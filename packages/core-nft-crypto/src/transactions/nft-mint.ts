import { Transactions, Utils } from "@arkecosystem/crypto";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NFTUpdateTransaction } from "./nft-update";
import { NftSchemas } from "./utils";

export class NFTMintTransaction extends NFTUpdateTransaction {

    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftMint;
    public static key: string = "NftMint";
    public static getSchema(): Transactions.schemas.TransactionSchema {
        return NftSchemas.nftMint;
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        NftTransactionStaticFees.NftMint,
    );
}
