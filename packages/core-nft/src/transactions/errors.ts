// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class NftOwnedError extends Errors.TransactionError {
    constructor(token?: string) {
        super(`Failed to apply transaction, because token '${token}' is already owned`);
    }
}
