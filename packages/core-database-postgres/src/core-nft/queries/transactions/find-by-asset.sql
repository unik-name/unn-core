SELECT *
FROM transactions
WHERE type IN (${types:list})
AND transactions.type_group = ${typeGroup}
and asset @> ${asset}
ORDER BY transactions.timestamp ${order:raw}, transactions.sequence ${order:raw}
