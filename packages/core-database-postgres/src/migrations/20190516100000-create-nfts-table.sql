-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.nfts (
    "id" VARCHAR(64) PRIMARY KEY,
    "owner_id" VARCHAR(36)
);
