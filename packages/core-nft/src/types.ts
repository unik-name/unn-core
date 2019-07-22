import { ITransactionData } from "@arkecosystem/crypto";

interface ConstraintApplicationContext {
    propertyKey: string;
    propertyNewValue: string;
    transaction: ITransactionData;
}

export { ConstraintApplicationContext };
