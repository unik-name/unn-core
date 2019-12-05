import { Builders } from "@uns/core-nft-crypto";
import * as path from "path";
import { TransactionFactory } from "../../../helpers";
import { defaultInclude, setUp as setup } from "./index";

const nftName: string = "unik";
const nftId: string = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
export const walletPassphrase: string =
    "enrich account dirt wedding noise acquire pipe rescue link quality laugh rough";

const token = "uns";
export const network = "dalinet";
const includes = defaultInclude.concat(["@uns/core-nft", "@uns/uns-transactions"]).map(include => {
    // replace pino logger by signale
    return include.endsWith("pino") ? "@arkecosystem/core-logger-signale" : include;
});
const corePackagePath: string = "../../../../packages/core";
const config = path.resolve(__dirname, corePackagePath, `bin/config/${network}`);
const data = `./.core-${network}`;
const delegatesFilePath = path.resolve(__dirname, config, "delegates.json");
const packageFilePath = path.resolve(__dirname, corePackagePath, "package.json");

// tslint:disable-next-line
const secrets = require(delegatesFilePath).secrets;
// tslint:disable-next-line
const version = require(packageFilePath).version;

const options = {
    network,
    token,
    config,
    data,
    version,
};

export const setUp = async (): Promise<void> => {
    process.env.CORE_P2P_PORT = "4002";

    return setup(options, includes, secrets);
};

export const nftMintTransaction = (properties?: any) => {
    const nftMintBuilder = new Builders.NftMintBuilder(nftName, nftId).properties(properties);
    return new TransactionFactory(nftMintBuilder);
};
