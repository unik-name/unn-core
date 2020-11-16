import { Container } from "@arkecosystem/core-interfaces";
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

export const setUp = async (options?: any): Promise<Container.IContainer> => {
    process.env.CORE_P2P_PORT = "4002";
    if (options?.disableP2P) {
        process.env.DISABLE_P2P_SERVER = options.disableP2P;
    }

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
    return Crypto.HashAlgorithms.sha256(new Date().getTime().toString()).toString("hex");
};

const defaultProperties = { type: "1" };
export const mintAndWait = async (nftId, properties = defaultProperties, passphrase = defaultPassphrase) => {
    const t = nftMintTransaction(nftId, properties)
        .withNetwork(network)
        .withPassphrase(passphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const addPropertiesAndWait = async (nftId, properties) => {
    const t = nftUpdateTransaction(nftId, properties)
        .withNetwork(network)
        .withPassphrase(defaultPassphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

// Ark transactions
export const transferAndWait = async (recipient, amount, passphrase = defaultPassphrase) => {
    const t = TransactionFactory.transfer(recipient, amount * 1e8)
        .withNetwork(network)
        .withPassphrase(passphrase)
        .createOne();
    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};
