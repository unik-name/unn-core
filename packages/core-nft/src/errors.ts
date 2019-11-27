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

export class NftPropertyTooLongError extends Errors.TransactionError {
    constructor(propertyKey?: string) {
        super(
            `Failed to apply transaction, because property '${propertyKey}' exceed the maximum allowed size of 255 bytes`,
        );
    }
}
