import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "@uns/core-nft-crypto";
import { NftsManager } from "./manager";
import { NftMintTransactionHandler } from "./transactions/handlers/nft-mint";
import { Handlers } from "@arkecosystem/core-transactions";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "core-nft",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Configuring NFT plugin");
        //Register transactions
        Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);

        return new NftsManager(options);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping NFT plugin");
        return;
    },
};
