import { Transactions, Utils } from "@arkecosystem/crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";

export class DelegateRegisterTransaction extends Transactions.DelegateRegistrationTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsDelegateRegister;
    public static key: string = "UnsDelegateRegister";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return Transactions.schemas.extend(Transactions.schemas.delegateRegistration, {
            $id: "unsDelegateRegister",
            properties: {
                type: { transactionType: UnsTransactionType.UnsDelegateRegister },
                typeGroup: { const: UnsTransactionGroup },
                asset: {
                    properties: {
                        delegate: {
                            properties: {
                                username: { $ref: "hex", minLength: 64, maxLength: 64 },
                            },
                        },
                    },
                },
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsDelegateRegister,
    );
}
