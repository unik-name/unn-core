SELECT *
FROM nftproperties
WHERE nft_id IN (${nftids:list}) AND key = ${key};
