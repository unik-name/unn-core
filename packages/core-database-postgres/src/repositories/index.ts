import { BlocksRepository } from "./blocks";
import { MigrationsRepository } from "./migrations";
import { RoundsRepository } from "./rounds";
import { TransactionsRepository } from "./transactions";

import { NftsRepository } from "../core-nft";

export const repositories = {
    blocks: BlocksRepository,
    migrations: MigrationsRepository,
    rounds: RoundsRepository,
    transactions: TransactionsRepository,

    // TODO: uns : find a better way to register repositories
    nfts: NftsRepository,
};
