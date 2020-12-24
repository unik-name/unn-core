import { Transactions, Utils } from "@arkecosystem/crypto";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftWithPropertiesTransaction } from "./abstract-nft-with-properties";
import { NftSchemas } from "./utils";

const { schemas } = Transactions;

export class NftUpdateTransaction extends AbstractNftWithPropertiesTransaction {
    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftUpdate;
    public static key: string = "NftUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "nftUpdate",
            required: ["asset"],
            properties: {
                type: { transactionType: NftUpdateTransaction.type },
                typeGroup: { const: NftUpdateTransaction.typeGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                ...schemas.extend(
                    NftSchemas.nft,
                    schemas.extend(NftSchemas.nftProperties, NftSchemas.requireProperties),
                ), // nft.properties is required
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(NftTransactionStaticFees.NftUpdate);
}
