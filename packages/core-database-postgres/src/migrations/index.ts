import { readdirSync } from "fs";
import { loadQueryFile } from "../utils";

import { migrationPaths } from "../core-nft";

export const migrations = readdirSync(__dirname)
    // TODO: uns : find better way to load migrations
    .concat(migrationPaths)
    .filter(name => name.substr(-4).toLowerCase() === ".sql")
    .sort()
    .map(name => loadQueryFile(__dirname, name));
