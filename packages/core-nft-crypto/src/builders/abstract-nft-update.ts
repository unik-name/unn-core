import { NftBuilder } from "./nft";

export abstract class AbstractNftUpdateBuilder<T extends AbstractNftUpdateBuilder<T>> extends NftBuilder<T> {
    public properties(properties: { [_: string]: string }): NftBuilder<T> {
        this.data.asset.nft[this.nftName].properties = properties;
        return this.instance();
    }
}
