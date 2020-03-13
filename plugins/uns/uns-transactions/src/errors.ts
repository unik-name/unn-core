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

export class CertifiedDemandIssuerNotFound extends Errors.TransactionError {
    constructor(txId, message) {
        super(`Failed to apply transaction ${txId}, because ${message}`);
    }
}

export class ForgeFactoryNotFound extends Errors.TransactionError {
    constructor(txId, message) {
        super(`Failed to apply transaction ${txId}: Unable to retrieve forge factory: ${message}`);
    }
}

export class CertifiedDemandNotAllowedIssuerError extends Errors.TransactionError {
    constructor(txId, issuerId) {
        super(`Failed to apply transaction ${txId}, because the demand issuer of id ${issuerId} is not allowed to`);
    }
}

export class UnikNameNotDisclosedError extends Errors.TransactionError {
    constructor(tokenId) {
        super(`Failed to apply transaction because the @unikname of token "${tokenId}" is not disclosed`);
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

export class CryptoAccountHasSeveralUniksError extends Errors.TransactionError {
    constructor() {
        super(`Failed to apply transaction: crypto-account has several Uniks`);
    }
}
export abstract class NftCertificationError extends Errors.TransactionError {
    constructor(message: string) {
        super("Failed to apply transaction Certified NFT Mint: " + message);
    }
}

export class NftCertificationBadSignatureError extends NftCertificationError {
    constructor() {
        super("Failed to check certification signature");
    }
}

export class NftCertificationBadPayloadSubjectError extends NftCertificationError {
    constructor() {
        super("Failed to check certification payload subject");
    }
}

export abstract class NftCertificationTimedError extends NftCertificationError {
    constructor(transactionId: string, time: number, suffix: string) {
        super(`Certification of transaction ${transactionId} is ${time} seconds ${suffix}`);
    }
}

export class NftTransactionParametersError extends NftCertificationError {
    constructor(parameter: string) {
        super(`Failed to apply transaction: invalid parameter \"${parameter}\"`);
    }
}
