import { NFTBuilder } from "./nft";

export abstract class AbstractNFTUpdateBuilder extends NFTBuilder {
    public properties(properties: { [_: string]: string }) {
        this.data.asset.nft.properties = properties;
        return this.instance();
    }
}
