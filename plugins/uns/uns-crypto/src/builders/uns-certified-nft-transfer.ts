import { Builders } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionType } from "../enums";
import { INftMintDemandCertification, INftMintDemandPayload } from "../interfaces";
import { CertifiedNftTransferTransaction } from "../transactions";
import { applyMixins } from "../utils";
import { IUNSCertifiedNftBuilder, UNSCertifiedNftBuilder } from "./uns-certified-nft-common";

export class UNSCertifiedNftTransferBuilder extends Builders.NftTransferBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super(nftName, tokenId);
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

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface UNSCertifiedNftTransferBuilder
    extends IUNSCertifiedNftBuilder<INftMintDemandPayload, INftMintDemandCertification> {}
applyMixins(UNSCertifiedNftTransferBuilder, [UNSCertifiedNftBuilder]);
