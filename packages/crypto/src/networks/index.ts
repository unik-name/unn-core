import { dalinet } from "./dalinet";
import { devnet } from "./devnet";
import { mainnet } from "./mainnet";
import { testnet } from "./testnet";
import { unitnet } from "./unitnet";

export type INetwork =
    | typeof mainnet.network
    | typeof devnet.network
    | typeof testnet.network
    | typeof unitnet.network
    | typeof dalinet.network;

export { devnet, mainnet, testnet, unitnet, dalinet };
