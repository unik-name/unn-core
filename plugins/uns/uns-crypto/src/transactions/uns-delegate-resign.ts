import { Transactions, Utils } from "@arkecosystem/crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";

export class DelegateResignTransaction extends Transactions.DelegateResignationTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsDelegateResign;
    public static key: string = "UnsDelegateResign";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return Transactions.schemas.extend(Transactions.schemas.delegateResignation, {
            $id: "unsDelegateResign",
            properties: {
                type: { transactionType: UnsTransactionType.UnsDelegateResign },
                typeGroup: { const: UnsTransactionGroup },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsDelegateResign,
    );
}
