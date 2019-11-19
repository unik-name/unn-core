import { schemas } from "@arkecosystem/crypto/src/transactions";
import { NftTransactionType, NftTransactionGroup, NftTransactionStaticFees } from "../enums";
import { NFTUpdateTransaction } from "./nft-update";
import { NftSchemas } from "./utils";
import { Utils } from "@arkecosystem/crypto";

export class NFTMintTransaction extends NFTUpdateTransaction {

    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftMint;
    public static key: string = "NftMint";

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        NftTransactionStaticFees.NftMint,
    );
    public static getSchema(): schemas.TransactionSchema {
        return NftSchemas.nftMint;
    }
}
