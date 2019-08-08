import { TransactionTypes } from "../../constants";
import { NFTUpdateTransaction } from "./nft-update";
import * as schemas from "./schemas";

export class NFTMintTransaction extends NFTUpdateTransaction {
    public static type: TransactionTypes = TransactionTypes.NftMint;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.nftMint;
    }
}
