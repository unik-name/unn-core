import { Transactions, Utils } from "@arkecosystem/crypto";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftUpdateTransaction } from "./nft-update";
import { NftSchemas } from "./utils";

const { schemas } = Transactions;

export class NftMintTransaction extends NftUpdateTransaction {
    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftMint;
    public static key: string = "NftMint";
    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "nftMint",
            required: ["asset"],
            properties: {
                type: { transactionType: NftTransactionType.NftMint },
                ...schemas.extend(NftSchemas.nft, NftSchemas.nftProperties),
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(NftTransactionStaticFees.NftMint);
}
