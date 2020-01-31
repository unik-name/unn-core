import { NftBuilder } from "./nft";

export abstract class AbstractNftWithPropertiesBuilder<
    T extends AbstractNftWithPropertiesBuilder<T>
> extends NftBuilder<T> {
    public properties(properties: { [_: string]: string }): this {
        this.data.asset.nft[this.nftName].properties = properties;
        return this;
    }
}
