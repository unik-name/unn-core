// tslint:disable:max-classes-per-file
import { State } from "@arkecosystem/core-interfaces";
import { Errors } from "@arkecosystem/core-transactions";

export class NftOwnerError extends Errors.TransactionError {
    // Warning when using `wallet` attributes, some of them might be undefined
    constructor(wallet: State.IWallet, tokenId: string) {
        super(`Failed to apply transaction, because wallet '${wallet.address}' is not the owner of token '${tokenId}'`);
    }
}

export class NftOwnedError extends Errors.TransactionError {
    constructor(tokenId: string) {
        super(`Failed to apply transaction, because token '${tokenId}' is already owned`);
    }
}

export class NftPropertyTooLongError extends Errors.TransactionError {
    constructor(propertyKey: string) {
        super(
            `Failed to apply transaction, because property '${propertyKey}' exceed the maximum allowed size of 255 bytes`,
        );
    }
}
