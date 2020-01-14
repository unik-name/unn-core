SELECT id
FROM transactions
WHERE
(
    (
        type IN (0,1,2)
        AND transactions.type_group = 2000
    )
    OR
    (
        type = 3
        AND transactions.type_group = 2001
    )
)
AND asset -> 'nft' -> ${nftName} ->> 'tokenId' = ${id}
ORDER BY transactions.timestamp ASC, transactions.sequence ASC
LIMIT 1
