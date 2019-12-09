import { Crypto, Managers } from "@arkecosystem/crypto";
import { Builders } from "@uns/core-nft-crypto";
import * as path from "path";
import { TransactionFactory } from "../../../helpers";
import { defaultInclude, setUp as setup, snoozeForBlock } from "./index";
import "./nft-jest-matchers";

export const nftName: string = "unik";

const token = "uns";
export const network = "dalinet";
const includes = defaultInclude.concat(["@uns/core-nft", "@uns/uns-transactions"]).map(include => {
    // replace ark pino logger by uns one
    return include.endsWith("pino") ? "@uns/logger-pino" : include;
});
const corePackagePath: string = "../../../../packages/core";
const config = path.resolve(__dirname, corePackagePath, `bin/config/${network}`);
const data = `./.core-${network}`;
const delegatesFilePath = path.resolve(__dirname, config, "delegates.json");
const packageFilePath = path.resolve(__dirname, corePackagePath, "package.json");

// tslint:disable-next-line
export const secrets = require(delegatesFilePath).secrets;

// it's genesis wallet
export const genesisPassphrase: string =
    "enrich account dirt wedding noise acquire pipe rescue link quality laugh rough";
export const defaultPassphrase: string = genesisPassphrase;

export const setUp = async (): Promise<void> => {
    process.env.CORE_P2P_PORT = "4002";
    Managers.configManager.setFromPreset(network);

    // tslint:disable-next-line
    const version = require(packageFilePath).version;

    return setup(
        {
            network,
            token,
            config,
            data,
            version,
        },
        includes,
        secrets,
    );
};

export const nftMintTransaction = (id: string, properties) => {
    const nftMintBuilder = new Builders.NftMintBuilder(nftName, id).properties(properties);
    return new TransactionFactory(nftMintBuilder);
};

export const nftUpdateTransaction = (id: string, properties) => {
    const nftUpdateBuilder = new Builders.NftUpdateBuilder(nftName, id).properties(properties);
    return new TransactionFactory(nftUpdateBuilder);
};

export const nftTransferTransaction = (id: string, recipient: string) => {
    const nftTransferBuilder = new Builders.NftTransferBuilder(nftName, id).recipientId(recipient);
    return new TransactionFactory(nftTransferBuilder);
};

export const generateNftId = () => {
    return Crypto.HashAlgorithms.sha256(new Date().toISOString()).toString("hex");
};

export const mintAndWait = async nftId => {
    const t = nftMintTransaction(nftId, { type: "1" })
        .withNetwork(network)
        .withPassphrase(defaultPassphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
};

export const addPropertyAndWait = async (nftId, key, value) => {
    const properties = {};
    properties[key] = value;

    const t = nftUpdateTransaction(nftId, properties)
        .withNetwork(network)
        .withPassphrase(defaultPassphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
};
