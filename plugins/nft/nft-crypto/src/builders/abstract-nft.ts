import { INftProperties } from "../interfaces";
import { NftBuilder } from "./nft";

export abstract class AbstractNftWithPropertiesBuilder<
    T extends AbstractNftWithPropertiesBuilder<T>
> extends NftBuilder<T> {
    public properties(properties: INftProperties): this {
        if (Object.keys(properties).length) {
            this.data.asset.nft[this.nftName].properties = properties;
        }
        return this;
    }
}
