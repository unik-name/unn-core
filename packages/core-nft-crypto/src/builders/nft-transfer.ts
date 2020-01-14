import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftBuilder } from "./nft";

export class NftTransferBuilder extends NftBuilder<NftTransferBuilder> {
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
