import { Builders } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionType } from "../enums";
import { ICertifiedDemand, INftDemandCertification, INftDemandPayload } from "../interfaces";
import { CertifiedNftUpdateTransaction } from "../transactions";

export class UNSCertifiedNftUpdateBuilder extends Builders.NftUpdateBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super(nftName, tokenId);
    }

    public certification(certification: INftDemandCertification, issuerAddress: string): this {
        this.data.asset.certification = certification;
        this.data.amount = certification.payload.cost;
        this.recipientId(issuerAddress);
        return this;
    }

    public demand(demand: ICertifiedDemand<INftDemandPayload>): this {
        this.data.asset.demand = demand;
        return this;
    }

    protected fees() {
        return CertifiedNftUpdateTransaction.staticFee();
    }

    protected type() {
        return UnsTransactionType.UnsCertifiedNftUpdate;
    }

    protected getTypeGroup() {
        return UnsTransactionGroup;
    }
}
