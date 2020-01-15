// tslint:disable:max-classes-per-file
import { Errors } from "@arkecosystem/core-transactions";

export class DiscloseDemandSignatureError extends Errors.TransactionError {
    constructor() {
        super(
            `Failed to apply transaction, because disclose demand signature does not correspond to the provided payload`,
        );
    }
}

export class DiscloseDemandCertificationSignatureError extends Errors.TransactionError {
    constructor() {
        super(
            `Failed to apply transaction, because disclose demand certification signature does not correspond to the provided payload`,
        );
    }
}

export class DiscloseDemandSubInvalidError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, certification does not match the disclose demand payload`);
    }
}

export class DiscloseDemandAlreadyExistsError extends Errors.TransactionError {
    constructor(txId) {
        super(`Failed to apply transaction ${txId}, because this disclose demand already exists`);
    }
}

export class DiscloseDemandIssuerError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction, because the disclose demand issuer is not allowed to`);
    }
}

export class UnikNameNotDisclosedError extends Errors.TransactionError {
    constructor(tokenId) {
        super(`Failed to apply transaction because the UnikName of token "${tokenId}" is not disclosed`);
    }
}

export class InvalidUnikTypeError extends Errors.TransactionError {
    constructor(type) {
        super(`Failed to register Unik as delegate: Unik of type "${type}" are not allowed to be delegate`);
    }
}

export class CryptoAccountAlreadyDelegateError extends Errors.TransactionError {
    constructor() {
        super(`Failed to register Unik as delegate: crypto-account has already a delegate Unik`);
    }
}

export class CryptoAccountNotADelegateError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction: crypto-account has no delegate Unik`);
    }
}
