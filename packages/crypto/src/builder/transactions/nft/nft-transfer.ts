import { TransactionTypes } from "../../../constants";
import { NFTBuilder } from "./nft";

export class NFTTransferBuilder extends NFTBuilder {
    constructor(tokenId: Buffer) {
        super(TransactionTypes.NftTransfer, tokenId);
    }

    protected instance(): NFTTransferBuilder {
        return this;
    }
}
