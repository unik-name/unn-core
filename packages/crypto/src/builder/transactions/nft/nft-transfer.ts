import { TransactionTypes } from "../../../constants";
import { Bignum } from "../../../utils";
import { NFTBuilder } from "./nft";

export class NFTTransferBuilder extends NFTBuilder {
    constructor(tokenId: Bignum) {
        super(TransactionTypes.NftTransfer, tokenId);
    }

    protected instance(): NFTTransferBuilder {
        return this;
    }
}
