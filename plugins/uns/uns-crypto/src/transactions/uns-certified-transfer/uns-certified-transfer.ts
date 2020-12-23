import { Transactions, Utils } from "@arkecosystem/crypto";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../../enums";
import { applyMixins } from "../../utils";
import { CertifiedNftTransaction, unsCertifiedProperties } from "../certified-nft-transaction";

const { schemas } = Transactions;
const { NftSchemas } = NftTransactions;
export class CertifiedNftTransferTransaction extends NftTransactions.NftTransferTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsCertifiedNftTransfer;
    public static key: string = "UnsCertifiedNftTransfer";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "unsCertifiedNftTransfer",
            properties: {
                type: { transactionType: CertifiedNftTransferTransaction.type },
                typeGroup: { const: CertifiedNftTransferTransaction.typeGroup },
                ...schemas.extend(NftSchemas.nft, schemas.extend(NftSchemas.nftProperties, unsCertifiedProperties)),
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsCertifiedNftTransfer,
    );
}

// Mixins must have the same interface name as the class
// tslint:disable:interface-name
// tslint:disable:no-empty-interface
export interface CertifiedNftTransferTransaction extends NftTransactions.NftTransferTransaction {}
applyMixins(CertifiedNftTransferTransaction, [CertifiedNftTransaction]);
