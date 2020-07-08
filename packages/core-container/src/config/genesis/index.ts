import { dalinet } from "./dalinet";
import { devnet } from "./devnet";
import { livenet } from "./livenet";
import { mainnet } from "./mainnet";
import { sandbox } from "./sandbox";
import { testnet } from "./testnet";
import { unitnet } from "./unitnet";

export const genesisBlocks = { devnet, mainnet, testnet, unitnet, dalinet, sandbox, livenet };
