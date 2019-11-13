import { Interfaces } from "@arkecosystem/crypto";
import { INftAsset } from "./interfaces/nft";

export const getCurrentNftAsset = (transactionData: Interfaces.ITransactionData): INftAsset => {
    if (
        transactionData &&
        transactionData.asset &&
        transactionData.asset.nft &&
        Object.keys(transactionData.asset.nft).length > 0
    ) {
        const nftName = Object.keys(transactionData.asset.nft)[0];
        return transactionData.asset.nft[nftName];
    }
    throw new Error(`Nft asset should be defined in transaction data. Transaction ID: ${transactionData.id}`);
};
