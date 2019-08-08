import { TransactionTypes } from "../../../constants";
import { AbstractNFTUpdateBuilder } from "./abstract-nft-update";

export class NFTUpdateBuilder extends AbstractNFTUpdateBuilder {
    protected instance(): NFTUpdateBuilder {
        return this;
    }

    protected type() {
        return TransactionTypes.NftUpdate;
    }
}
