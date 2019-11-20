import * as networks from "./networks";

export type NetworkType =
    | typeof networks.mainnet.network
    | typeof networks.devnet.network
    | typeof networks.testnet.network
    | typeof networks.unitnet.network

    // TODO: uns : find better way to add networks
    | typeof networks.dalinet.network;

export type NetworkName = keyof typeof networks;
