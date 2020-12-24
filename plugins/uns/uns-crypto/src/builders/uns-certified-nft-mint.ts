import { Builders } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionType } from "../enums";
import { INftDemand, INftDemandCertification } from "../interfaces";
import { CertifiedNftMintTransaction } from "../transactions";

export class UNSCertifiedNftMintBuilder extends Builders.NftMintBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super(nftName, tokenId);
    }

    public certification(certification: INftDemandCertification, issuerAddress: string): this {
        this.data.asset.certification = certification;
        this.data.amount = certification.payload.cost;
        this.recipientId(issuerAddress);
        return this;
    }

    public demand(demand: INftDemand): this {
        this.data.asset.demand = demand;
        return this;
    }

    protected fees() {
        return CertifiedNftMintTransaction.staticFee();
    }

    protected type() {
        return UnsTransactionType.UnsCertifiedNftMint;
    }

    protected getTypeGroup() {
        return UnsTransactionGroup;
    }
}
