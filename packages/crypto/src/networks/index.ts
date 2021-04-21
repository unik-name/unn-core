// export { devnet } from "./devnet";
// export { mainnet } from "./mainnet";
// export { testnet } from "./testnet";
// export { unitnet } from "./unitnet";

import { dalinet } from "./dalinet";

const devnet = dalinet;
const mainnet = dalinet;
const testnet = dalinet;
const unitnet = dalinet;

export { devnet, mainnet, testnet, unitnet };

// TODO: uns : find better way to import new network
// export { dalinet } from "./dalinet";
export { sandbox } from "./sandbox";
export { livenet } from "./livenet";
