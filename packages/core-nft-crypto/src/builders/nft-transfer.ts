import { NftTransactionType } from "../enums";
import { NFTBuilder } from "./nft";

export class NFTTransferBuilder  extends NFTBuilder<NFTTransferBuilder> {
    protected instance(): NFTTransferBuilder {
        return this;
    }

    protected type() {
        return NftTransactionType.NftTransfer;
    }
}
