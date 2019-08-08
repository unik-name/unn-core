import { TransactionTypes } from "../../../constants";
import { NFTBuilder } from "./nft";

export class NFTTransferBuilder extends NFTBuilder {
    protected instance(): NFTTransferBuilder {
        return this;
    }

    protected type() {
        return TransactionTypes.NftTransfer;
    }
}
