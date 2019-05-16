import { BlocksRepository } from "./blocks";
import { MigrationsRepository } from "./migrations";
import { NftsRepository } from "./nfts";
import { RoundsRepository } from "./rounds";
import { TransactionsRepository } from "./transactions";

export const repositories = {
    blocks: BlocksRepository,
    migrations: MigrationsRepository,
    rounds: RoundsRepository,
    transactions: TransactionsRepository,
    nfts: NftsRepository,
};
