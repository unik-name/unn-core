import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftWithPropertiesBuilder } from "./abstract-nft";

export class NftTransferBuilder extends AbstractNftWithPropertiesBuilder<NftTransferBuilder> {
    protected instance(): this {
        return this;
    }

    protected type(): number {
        return NftTransactionType.NftTransfer;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftTransfer);
    }
}
