SELECT id
FROM transactions
WHERE type IN (0,1,2)
AND transactions.type_group = 1337
AND asset -> 'nft' -> 'unik' ->> 'tokenId' = ${id}
ORDER BY transactions.timestamp ASC, transactions.sequence ASC
LIMIT 1
