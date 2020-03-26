import { Transactions, Utils } from "@arkecosystem/crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";

export class VoteTransaction extends Transactions.VoteTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsVote;
    public static key: string = "UnsVote";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return Transactions.schemas.extend(Transactions.schemas.vote, {
            $id: "unsVote",
            properties: {
                type: { transactionType: UnsTransactionType.UnsVote },
                typeGroup: { const: UnsTransactionGroup },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(UnsTransactionStaticFees.UnsVote);
}
