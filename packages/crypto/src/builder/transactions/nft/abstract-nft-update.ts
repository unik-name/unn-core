import { configManager } from "../../../managers";
import { NFTBuilder } from "./nft";

export abstract class AbstractNFTUpdateBuilder<T extends AbstractNFTUpdateBuilder<T>> extends NFTBuilder<T> {
    public properties(properties: { [_: string]: string }): T {
        this.data.asset.nft[configManager.getCurrentNftName()].properties = properties;
        return this.instance();
    }
}
