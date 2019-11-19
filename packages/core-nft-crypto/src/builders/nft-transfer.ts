import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftBuilder } from "./nft";

export class NftTransferBuilder extends NftBuilder<NftTransferBuilder> {
    protected instance(): NftTransferBuilder {
        return this;
    }

    protected type() {
        return NftTransactionType.NftTransfer;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftTransfer);
    }
}
