import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";
import { IDiscloseDemand, IDiscloseDemandCertification } from "../interfaces";

export class UNSDiscloseExplicitBuilder extends Transactions.TransactionBuilder<UNSDiscloseExplicitBuilder> {
    constructor() {
        super();

        this.data.version = 2;
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.senderPublicKey = undefined;
        this.data.type = UnsTransactionType.UnsDiscloseExplicit;
        this.data.typeGroup = UnsTransactionGroup;
        this.data.fee = Utils.BigNumber.make(UnsTransactionStaticFees.UnsDiscloseExplicit);
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        struct.amount = this.data.amount;
        return struct;
    }

    public discloseDemand(
        demand: IDiscloseDemand,
        certification: IDiscloseDemandCertification,
    ): UNSDiscloseExplicitBuilder {
        this.data.asset = {
            "disclose-demand": demand,
            "disclose-demand-certification": certification,
        };
        return this.instance();
    }

    protected instance(): UNSDiscloseExplicitBuilder {
        return this;
    }
}
