import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftUpdateBuilder } from "./abstract-nft-update";

export class NftUpdateBuilder extends AbstractNftUpdateBuilder<NftUpdateBuilder> {
    protected instance(): this {
        return this;
    }

    protected type(): number {
        return NftTransactionType.NftUpdate;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftUpdate);
    }
}
