import { loadQueryFile } from "../../utils";

export const queries = {
    nfts: {
        findById: loadQueryFile(__dirname, "./nfts/find-by-id.sql"),
        delete: loadQueryFile(__dirname, "./nfts/delete.sql"),
        updateOwnerId: loadQueryFile(__dirname, "./nfts/update-owner-id.sql"),
        findFirstTransaction: loadQueryFile(__dirname, "./nfts/find-first-transaction.sql"),
        findLastTransaction: loadQueryFile(__dirname, "./nfts/find-last-transaction.sql"),
        deleteProperties: loadQueryFile(__dirname, "./nftproperties/delete-properties.sql"),
        insertKey: loadQueryFile(__dirname, "./nftproperties/insert.sql"),
        updateProperty: loadQueryFile(__dirname, "./nftproperties/update-property.sql"),
        insertOrUpdateProperty: loadQueryFile(__dirname, "./nftproperties/insert-or-update-property.sql"),
        findByKey: loadQueryFile(__dirname, "./nftproperties/findByKey.sql"),
        deleteByKey: loadQueryFile(__dirname, "./nftproperties/deleteByKey.sql"),
        findProperties: loadQueryFile(__dirname, "./nftproperties/find-by-nft-id.sql"),
        unikStatus: loadQueryFile(__dirname, "./nftproperties/unikStatus.sql"),
    },
};
