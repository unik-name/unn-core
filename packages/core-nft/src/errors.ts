// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class NftOwnerError extends Errors.TransactionError {
    constructor(wallet?: string, token?: string) {
        super(`Failed to apply transaction, because wallet ${wallet} is not the owner of token '${token}'`);
    }
}

export class NftOwnedError extends Errors.TransactionError {
    constructor(token?: string) {
        super(`Failed to apply transaction, because token '${token}' is already owned`);
    }
}
