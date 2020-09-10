import { Interfaces, Utils } from "@arkecosystem/crypto";
import { ICertificationable, ICertifiedDemand, INftDemandCertificationPayload, INftDemandPayload } from "../interfaces";
import { getVoucherRewards, hasVoucher } from "../utils";

export interface IUNSCertifiedNftBuilder<T extends INftDemandPayload, U extends ICertifiedDemand<ICertificationable>> {
    /**
     * @param demand The demand to certified
     */
    demand(demand: ICertifiedDemand<T>): this;

    /**
     * @param certification The certification itself, according to the demande set by #demand()
     */
    certification(certification: U, issuerAddress: string): this;
}

export class UNSCertifiedNftBuilder<
    T extends INftDemandPayload,
    U extends ICertifiedDemand<INftDemandCertificationPayload>
> implements IUNSCertifiedNftBuilder<T, U> {
    public data: Interfaces.ITransactionData;

    public demand(demand: ICertifiedDemand<T>): this {
        this.data.asset.demand = demand;
        return this;
    }

    public certification(certification: U, issuerAddress: string): this {
        this.data.asset.certification = certification;
        this.data.amount = certification.payload.cost;
        this.data.recipientId = issuerAddress;

        // set fees for mint with voucher
        if (hasVoucher(this.data.asset)) {
            const rewards = getVoucherRewards(this.data.asset);
            this.data.fee = Utils.BigNumber.make(rewards.forger);
        }

        return this;
    }
}
