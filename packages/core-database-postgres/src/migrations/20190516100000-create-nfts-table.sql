-- Table Definition
CREATE TABLE IF NOT EXISTS ${schema~}.nfts (
    "id" VARCHAR(64) PRIMARY KEY,
    "owner_id" VARCHAR(36)
);

-- Constraints
CREATE INDEX IF NOT EXISTS "nfts_owner_id" ON nfts ("owner_id");