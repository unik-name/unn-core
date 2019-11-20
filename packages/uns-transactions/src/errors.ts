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
