import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { IDiscloseDemand, IDiscloseDemandCertification } from "../interfaces";

export class UNSDiscloseExplicitBuilder extends Transactions.TransactionBuilder<UNSDiscloseExplicitBuilder> {
    constructor() {
        super();

        this.data.amount = Utils.BigNumber.ZERO;
        this.data.senderPublicKey = undefined;

        // this.data.type = this.type();
        // this.data.fee = Utils.BigNumber.make(getNftTransactionFees(this.data.type));
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

    protected type() {
        return; // UnsTransactionType.UnsDiscloseExplicit;
    }
}
