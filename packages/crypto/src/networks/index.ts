// export { devnet } from "./devnet";
// export { mainnet } from "./mainnet";
// export { testnet } from "./testnet";
// export { unitnet } from "./unitnet";

const mock = {
    exceptions: {
        blocks: [],
        transactions: [],
    },
    milestones: [],
    network: {
        name: "",
        messagePrefix: "",
        bip32: {
            public: 0,
            private: 0,
        },
        pubKeyHash: 0,
        nethash: "",
        wif: 0,
        slip44: 0,
        aip20: 0,
        client: {
            token: "",
            symbol: "",
            explorer: "",
        },
    },
};

const devnet = mock;
const mainnet = mock;
const testnet = mock;
const unitnet = mock;

export { devnet, mainnet, testnet, unitnet };

// TODO: uns : find better way to import new network
export { dalinet } from "./dalinet";
export { sandbox } from "./sandbox";
export { livenet } from "./livenet";
