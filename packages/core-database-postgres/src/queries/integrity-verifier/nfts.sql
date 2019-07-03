SELECT  asset,
        recipient_id,
        sender_public_key
FROM transactions
WHERE TYPE = 9
ORDER BY (timestamp + sequence) DESC
