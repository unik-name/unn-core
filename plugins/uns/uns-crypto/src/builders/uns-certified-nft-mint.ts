import { Builders } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionType } from "../enums";
import { INftMintDemandCertification, INftMintDemandPayload } from "../interfaces";
import { CertifiedNftMintTransaction } from "../transactions";
import { applyMixins } from "../utils";
import { IUNSCertifiedNftBuilder, UNSCertifiedNftBuilder } from "./uns-certified-nft-common";

export class UNSCertifiedNftMintBuilder extends Builders.NftMintBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super(nftName, tokenId);
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

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface UNSCertifiedNftMintBuilder
    extends IUNSCertifiedNftBuilder<INftMintDemandPayload, INftMintDemandCertification> {}
applyMixins(UNSCertifiedNftMintBuilder, [UNSCertifiedNftBuilder]);
