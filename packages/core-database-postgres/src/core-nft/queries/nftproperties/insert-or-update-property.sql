INSERT INTO nftproperties
VALUES (${nftid}, ${key}, ${value})
ON CONFLICT ON CONSTRAINT PK_NFTProperties
DO
    UPDATE SET value = ${value};
