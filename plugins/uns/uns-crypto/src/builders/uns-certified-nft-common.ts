import { Interfaces } from "@arkecosystem/crypto";
import { UNSCertifiedNftMintBuilder, UNSCertifiedNftUpdateBuilder } from ".";
import { ICertificationable, ICertifiedDemand, INftDemandCertificationPayload, INftDemandPayload } from "../interfaces";

export interface IUNSCertifiedNftBuilder<T extends INftDemandPayload, U extends ICertifiedDemand<ICertificationable>> {
    /**
     * @param demand The demand to certified
     */
    demand(demand: ICertifiedDemand<T>): this;

    /**
     * @param certification The certification itself, according to the demand set by #demand()
     */
    certification(certification: U, issuerAddress?: string): this;
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

    public certification(certification: U, issuerAddress?: string): this {
        this.data.asset.certification = certification;
        if (this instanceof UNSCertifiedNftMintBuilder || this instanceof UNSCertifiedNftUpdateBuilder) {
            this.data.amount = certification.payload.cost;
            this.recipientId(issuerAddress);
        }
        return this;
    }
}
