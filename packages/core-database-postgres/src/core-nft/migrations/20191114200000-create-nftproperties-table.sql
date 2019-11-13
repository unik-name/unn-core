-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.nftproperties (
    "nft_id" VARCHAR(64) NOT NULL,
    "key" VARCHAR(255) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    CONSTRAINT PK_NFTProperties PRIMARY KEY ("nft_id", "key")
);
