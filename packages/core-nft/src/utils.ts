import { Interfaces } from "@arkecosystem/crypto";
import { INftAsset } from "./interfaces";

// TODO: uns : remember to update here to handle multiple tokens
export const getNftName = (transactionData: Interfaces.ITransactionData): string | undefined => {
    let ret: string;
    if (
        transactionData &&
        transactionData.asset &&
        transactionData.asset.nft &&
        Object.keys(transactionData.asset.nft).length > 0
    ) {
        ret = Object.keys(transactionData.asset.nft)[0];
    }
    return ret;
};

export const getCurrentNftAsset = (transactionData: Interfaces.ITransactionData): INftAsset => {
    const nftName = getNftName(transactionData);
    if (nftName) {
        return transactionData.asset.nft[nftName];
    }
    throw new Error(`Nft asset should be defined in transaction data. Transaction ID: ${transactionData.id}`);
};
