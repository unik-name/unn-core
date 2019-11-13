import { readdirSync } from "fs";

export const migrationPaths = readdirSync(__dirname).map(path => "../core-nft/migrations/".concat(path));
