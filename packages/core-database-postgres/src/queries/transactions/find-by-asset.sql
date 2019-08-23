SELECT *
FROM transactions
WHERE asset @> ${asset};
