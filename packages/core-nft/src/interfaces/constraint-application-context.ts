import { Interfaces } from "@arkecosystem/crypto";

export interface IConstraintApplicationContext {
    key: string;
    value: string;
    transaction: Interfaces.ITransactionData;
}
