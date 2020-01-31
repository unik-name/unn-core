import { Interfaces } from "@arkecosystem/crypto";
import { ICertificationable, ICertifiedDemand, INftDemandPayload } from "../interfaces";

export interface IUNSCertifiedNftBuilder<T extends INftDemandPayload, U extends ICertifiedDemand<ICertificationable>> {
    /**
     * @param demand The demand to certified
     */
    demand(demand: ICertifiedDemand<T>): this;

    /**
     * @param certification The certification itself, according to the demande set by #demand()
     */
    certification(certification: U): this;
}

export class UNSCertifiedNftBuilder<T extends INftDemandPayload, U extends ICertifiedDemand<ICertificationable>>
    implements IUNSCertifiedNftBuilder<T, U> {
    public data: Interfaces.ITransactionData;

    public demand(demand: ICertifiedDemand<T>): this {
        this.data.asset.demand = demand;
        return this;
    }

    public certification(certification: U): this {
        this.data.asset.certification = certification;
        return this;
    }
}
