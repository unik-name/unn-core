SELECT id
FROM transactions
WHERE type IN (1,2,3)
AND transactions.type_group = 1000
AND asset->'nft'->${nftName}->'tokenId' = ${id}
ORDER BY transactions.timestamp DESC, transactions.sequence DESC
LIMIT 1