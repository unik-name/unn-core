import { Utils } from "@arkecosystem/crypto";
import { Builders } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";
import { ICertifiedDemand, INftMintDemandCertification, INftMintDemandPayload } from "../interfaces";

export class UNSCertifiedNftMintBuilder extends Builders.NftMintBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super(nftName, tokenId);
    }

    public demand(demand: ICertifiedDemand<INftMintDemandPayload>) {
        this.data.asset.demand = demand;
        return this;
    }

    public certification(certification: INftMintDemandCertification): this {
        this.data.asset.certification = certification;
        return this;
    }

    protected fees() {
        return Utils.BigNumber.make(UnsTransactionStaticFees.UnsCertifiedNftMint);
    }

    protected type() {
        return UnsTransactionType.UnsCertifiedNftMint;
    }

    protected getTypeGroup() {
        return UnsTransactionGroup;
    }
}
