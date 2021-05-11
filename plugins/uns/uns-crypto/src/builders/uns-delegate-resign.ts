import { Utils } from "@arkecosystem/crypto";
import { DelegateResignationBuilder } from "@arkecosystem/crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";

export class UNSDelegateResignBuilder extends DelegateResignationBuilder {
    constructor() {
        super();
        this.data.type = UnsTransactionType.UnsDelegateResign;
        this.data.typeGroup = UnsTransactionGroup;
        this.data.fee = Utils.BigNumber.make(UnsTransactionStaticFees.UnsDelegateResign);
    }

    protected instance(): UNSDelegateResignBuilder {
        return this;
    }
}
