import { Interfaces } from "@arkecosystem/crypto";
import { ICertifiedDemand, INftDemandPayload } from "../interfaces";

export interface IUNSCertifiedNftBuilder<T extends INftDemandPayload> {
    /**
     * @param demand The demand to certified
     */
    demand(demand: ICertifiedDemand<T>): this;
}

export class UNSCertifiedNftBuilder<T extends INftDemandPayload> implements IUNSCertifiedNftBuilder<T> {
    public data: Interfaces.ITransactionData;

    public demand(demand: ICertifiedDemand<T>): this {
        this.data.asset.demand = demand;
        return this;
    }
}
