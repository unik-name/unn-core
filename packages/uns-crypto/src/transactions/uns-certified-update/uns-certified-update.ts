import { Transactions, Utils } from "@arkecosystem/crypto";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../../enums";
import { applyMixins } from "../../utils";
import { CertifiedNftTransaction, unsCertifiedBaseTransactionSchema } from "../certified-nft-transaction";

const { schemas } = Transactions;
const { NftSchemas } = NftTransactions;
export class CertifiedNftUpdateTransaction extends NftTransactions.NftUpdateTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsCertifiedNftUpdate;
    public static key: string = "UnsCertifiedNftUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "unsCertifiedNftUpdate",
            properties: {
                type: { transactionType: CertifiedNftUpdateTransaction.type },
                typeGroup: { const: CertifiedNftUpdateTransaction.typeGroup },
                ...schemas.extend(
                    NftSchemas.nft,
                    schemas.extend(NftSchemas.nftProperties, NftSchemas.nftUpdateProperties),
                ),
                ...unsCertifiedBaseTransactionSchema,
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsCertifiedNftUpdate,
    );
}

// Mixins must have the same interface name as the class
// tslint:disable:interface-name
// tslint:disable:no-empty-interface
export interface CertifiedNftUpdateTransaction extends NftTransactions.NftUpdateTransaction {}
applyMixins(CertifiedNftUpdateTransaction, [CertifiedNftTransaction]);
