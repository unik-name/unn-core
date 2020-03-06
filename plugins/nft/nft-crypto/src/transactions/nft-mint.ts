import { Transactions, Utils } from "@arkecosystem/crypto";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftWithPropertiesTransaction } from "./abstract-nft-with-properties";
import { NftSchemas } from "./utils";

const { schemas } = Transactions;
export class NftMintTransaction extends AbstractNftWithPropertiesTransaction {
    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftMint;
    public static key: string = "NftMint";
    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "nftMint",
            required: ["asset"],
            properties: {
                type: { transactionType: NftMintTransaction.type },
                typeGroup: { const: NftMintTransaction.typeGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                ...schemas.extend(NftSchemas.nft, NftSchemas.nftProperties),
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(NftTransactionStaticFees.NftMint);
}
