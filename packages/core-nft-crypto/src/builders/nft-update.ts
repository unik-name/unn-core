import { NftTransactionType } from "../enums";
import { AbstractNFTUpdateBuilder } from "./abstract-nft-update";

export class NFTUpdateBuilder extends AbstractNFTUpdateBuilder<NFTUpdateBuilder> {
    protected instance(): NFTUpdateBuilder {
        return this;
    }

    protected type() {
        return NftTransactionType.NftUpdate;
    }
}
