import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { defaults } from "./defaults";
import { NftsManager } from "./manager";
import { NftMintTransactionHandler, NftTransferTransactionHandler, NftUpdateTransactionHandler } from "./transactions";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "core-nft",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("💎 - Starting NFT plugin");

        // Register transactions
        Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);
        Handlers.Registry.registerTransactionHandler(NftUpdateTransactionHandler);
        Handlers.Registry.registerTransactionHandler(NftTransferTransactionHandler);

        return new NftsManager(options);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping NFT plugin");
        return;
    },
};
