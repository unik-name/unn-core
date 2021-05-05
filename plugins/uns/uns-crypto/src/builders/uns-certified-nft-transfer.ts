import { Builders } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionType } from "../enums";
import { ICertifiedDemand, INftDemandCertification, INftDemandPayload } from "../interfaces";
import { CertifiedNftTransferTransaction } from "../transactions";

export class UNSCertifiedNftTransferBuilder extends Builders.NftTransferBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super(nftName, tokenId);
    }

    public certification(certification: INftDemandCertification): this {
        this.data.asset.certification = certification;
        return this;
    }

    public demand(demand: ICertifiedDemand<INftDemandPayload>): this {
        this.data.asset.demand = demand;
        return this;
    }

    protected fees() {
        return CertifiedNftTransferTransaction.staticFee();
    }

    protected type() {
        return UnsTransactionType.UnsCertifiedNftTransfer;
    }

    protected getTypeGroup() {
        return UnsTransactionGroup;
    }
}
