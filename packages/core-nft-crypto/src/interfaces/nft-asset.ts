export interface INftAsset {
    tokenId: string;
    properties?: INftProperties;
}

export interface INftProperties {
    [_: string]: string;
}

export interface ITransactionNftAssetData {
    nft: {
        [_: string]: INftAsset;
    };
}
