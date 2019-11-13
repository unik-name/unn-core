SELECT  asset,
        recipient_id,
        sender_public_key
FROM transactions
WHERE TYPE = 9 OR TYPE = 11
ORDER BY (timestamp + sequence) DESC
