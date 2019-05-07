SELECT sender_public_key,
       asset
FROM transactions
WHERE TYPE = 9
ORDER BY (timestamp + sequence) DESC
