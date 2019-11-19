import { readdirSync } from "fs";
import { loadQueryFile } from "../utils";

import { migrations as nftMigrations } from "../core-nft";

export const migrations = readdirSync(__dirname)
    .filter(name => name.substr(-4).toLowerCase() === ".sql")
    .sort()
    .map(name => loadQueryFile(__dirname, name))

    // TODO: uns : find better way to load migrations
    .concat(nftMigrations);
