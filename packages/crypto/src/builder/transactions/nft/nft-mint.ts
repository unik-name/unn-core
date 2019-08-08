import { TransactionTypes } from "../../../constants";
import { NFTUpdateBuilder } from "./nft-update";

export class NFTMintBuilder extends NFTUpdateBuilder {
    protected instance(): NFTMintBuilder {
        return this;
    }

    protected type() {
        return TransactionTypes.NftMint;
    }
}
