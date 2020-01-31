import { Transactions, Utils } from "@arkecosystem/crypto";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../../enums";
import { applyMixins } from "../../utils";
import { CertifiedNftTransaction, unsCertifiedBaseTransactionSchema } from "../certified-nft-transaction";

export class CertifiedNftUpdateTransaction extends NftTransactions.NftUpdateTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsCertifiedNftUpdate;
    public static key: string = "UnsCertifiedNftUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return Transactions.schemas.extend(NftTransactions.NftUpdateTransaction.getSchema(), {
            $id: "unsCertifiedNftUpdate",
            properties: {
                type: { transactionType: CertifiedNftUpdateTransaction.type },
                typeGroup: { const: CertifiedNftUpdateTransaction.typeGroup },
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
