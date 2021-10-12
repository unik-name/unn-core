import { Interfaces } from "@arkecosystem/crypto";
import { Interfaces as NftInterfaces } from "./";

// TODO: uns : remember to update here to handle multiple tokens
export const getNftName = (asset: Interfaces.ITransactionAsset): string | undefined => {
    let ret: string;
    if (asset && asset.nft && Object.keys(asset.nft).length > 0) {
        ret = Object.keys(asset.nft)[0];
    }
    return ret;
};

export const getCurrentNftAsset = (asset: Interfaces.ITransactionAsset): NftInterfaces.INftAsset => {
    const nftName = getNftName(asset);
    if (nftName) {
        return asset.nft[nftName];
    }
    throw new Error(`Nft asset should be defined in transaction data.`);
};

export const getTokenId = (asset: Interfaces.ITransactionAsset): string => {
    if (asset["disclose-demand"]) {
        return asset["disclose-demand"].payload.sub;
    }
    return getCurrentNftAsset(asset).tokenId;
};
