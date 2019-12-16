SELECT *
FROM transactions
WHERE type IN (${types:list})
AND transactions.type_group = ${typeGroup}
and asset @> ${asset}
ORDER BY transactions.timestamp DESC, transactions.sequence DESC
