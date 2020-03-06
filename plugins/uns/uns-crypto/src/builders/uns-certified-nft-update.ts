import { Utils } from "@arkecosystem/crypto";
import { Builders } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";
import { INftUpdateDemandCertification, INftUpdateDemandPayload } from "../interfaces";
import { applyMixins } from "../utils";
import { IUNSCertifiedNftBuilder, UNSCertifiedNftBuilder } from "./uns-certified-nft-common";

export class UNSCertifiedNftUpdateBuilder extends Builders.NftUpdateBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super(nftName, tokenId);
    }

    protected fees() {
        return Utils.BigNumber.make(UnsTransactionStaticFees.UnsCertifiedNftUpdate);
    }

    protected type() {
        return UnsTransactionType.UnsCertifiedNftUpdate;
    }

    protected getTypeGroup() {
        return UnsTransactionGroup;
    }
}

// Mixins must have the same interface name as the class
// tslint:disable-next-line:interface-name
export interface UNSCertifiedNftUpdateBuilder
    extends IUNSCertifiedNftBuilder<INftUpdateDemandPayload, INftUpdateDemandCertification> {}
applyMixins(UNSCertifiedNftUpdateBuilder, [UNSCertifiedNftBuilder]);
