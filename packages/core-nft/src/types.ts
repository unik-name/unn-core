import { Interfaces } from "@arkecosystem/crypto";

interface IConstraintApplicationContext {
    propertyKey: string;
    propertyNewValue: string;
    transaction: Interfaces.ITransactionData;
}

export { IConstraintApplicationContext };
