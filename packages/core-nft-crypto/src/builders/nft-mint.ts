import { NftTransactionType } from "../enums";
import { NFTUpdateBuilder } from "./nft-update";

export class NFTMintBuilder extends NFTUpdateBuilder {
    protected type() {
        return NftTransactionType.NftMint;
    }

    protected instance(): NFTMintBuilder {
        return this;
    }
}
