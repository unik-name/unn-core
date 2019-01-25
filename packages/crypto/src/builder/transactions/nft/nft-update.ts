import { TransactionTypes } from "../../../constants";
import { Bignum } from "../../../utils";
import { NFTBuilder } from "./nft";

export class NFTUpdateBuilder extends NFTBuilder {
    constructor(tokenId: Bignum) {
        super(TransactionTypes.NftUpdate, tokenId);
    }

    public properties(properties: Array<[string, string]>) {
        this.data.asset.nft.properties = properties;
        return this.instance();
    }

    protected instance(): NFTUpdateBuilder {
        return this;
    }
}
