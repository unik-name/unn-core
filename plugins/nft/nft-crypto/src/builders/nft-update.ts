import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftWithPropertiesBuilder } from "./abstract-nft";

export class NftUpdateBuilder extends AbstractNftWithPropertiesBuilder<NftUpdateBuilder> {
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
