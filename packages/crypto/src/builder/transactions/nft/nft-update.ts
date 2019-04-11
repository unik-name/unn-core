import { TransactionTypes } from "../../../constants";
import { NFTBuilder } from "./nft";

export class NFTUpdateBuilder extends NFTBuilder {
    constructor(tokenId: Buffer) {
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
