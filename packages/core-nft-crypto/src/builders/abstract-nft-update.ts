import { getNftNameFromConfig } from "../utils";
import { NFTBuilder } from "./nft";

export abstract class AbstractNFTUpdateBuilder<T extends AbstractNFTUpdateBuilder<T>> extends NFTBuilder<T> {
    public properties(properties: { [_: string]: string }): NFTBuilder<T> {
        this.data.asset.nft[getNftNameFromConfig()].properties = properties;
        return this.instance();
    }
}
