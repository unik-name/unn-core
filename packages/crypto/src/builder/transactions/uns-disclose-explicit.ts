import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers";
import { DiscloseDemand, DiscloseDemandCertification, ITransactionData } from "../../transactions";
import { TransactionBuilder } from "./transaction";

export class UNSDiscloseExplicitBuilder extends TransactionBuilder<UNSDiscloseExplicitBuilder> {
    constructor() {
        super();

        this.data.amount = 0;
        this.data.senderPublicKey = null;

        this.data.type = this.type();
        this.data.fee = feeManager.get(this.data.type);
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.asset = this.data.asset;
        struct.amount = this.data.amount;
        return struct;
    }

    public discloseDemand(
        demand: DiscloseDemand,
        certification: DiscloseDemandCertification,
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
        return TransactionTypes.UnsDiscloseExplicit;
    }
}
