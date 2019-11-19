import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftUpdateBuilder } from "./abstract-nft-update";

export class NftUpdateBuilder extends AbstractNftUpdateBuilder<NftUpdateBuilder> {
    protected instance(): NftUpdateBuilder {
        return this;
    }

    protected type() {
        return NftTransactionType.NftUpdate;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftUpdate);
    }
}
