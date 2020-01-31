import { Transactions, Utils } from "@arkecosystem/crypto";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../../enums";
import { applyMixins } from "../../utils";
import { CertifiedNftTransaction, unsCertifiedBaseTransactionSchema } from "../certified-nft-transaction";

export class CertifiedNftMintTransaction extends NftTransactions.NftMintTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsCertifiedNftMint;
    public static key: string = "UnsCertifiedNftMint";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return Transactions.schemas.extend(NftTransactions.NftMintTransaction.getSchema(), {
            $id: "unsCertifiedNftMint",
            properties: {
                type: { transactionType: CertifiedNftMintTransaction.type },
                typeGroup: { const: CertifiedNftMintTransaction.typeGroup },
                ...unsCertifiedBaseTransactionSchema,
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsCertifiedNftMint,
    );
}

// Mixins must have the same interface name as the class
// tslint:disable:interface-name
// tslint:disable:no-empty-interface
export interface CertifiedNftMintTransaction extends NftTransactions.NftMintTransaction {}
applyMixins(CertifiedNftMintTransaction, [CertifiedNftTransaction]);
