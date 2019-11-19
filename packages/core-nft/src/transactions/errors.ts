// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class StaticFeeMismatchError extends Errors.TransactionError {
    constructor(staticFee: string) {
        super(`Failed to apply transaction, because fee doesn't match static fee ${staticFee}.`);
    }
}

export class NftOwnedError extends Errors.TransactionError {
    constructor(token?: string) {
        super(`Failed to apply transaction, because token '${token}' is already owned`);
    }
}
