import { Utils } from "@arkecosystem/crypto";
import { DelegateRegistrationBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/delegate-registration";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";

export class UNSDelegateRegisterBuilder extends DelegateRegistrationBuilder {
    constructor() {
        super();
        this.data.type = UnsTransactionType.UnsDelegateRegister;
        this.data.typeGroup = UnsTransactionGroup;
        this.data.fee = Utils.BigNumber.make(UnsTransactionStaticFees.UnsDelegateRegister);
    }

    protected instance(): UNSDelegateRegisterBuilder {
        return this;
    }
}
