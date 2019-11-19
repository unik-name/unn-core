import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { NftsManager } from "./manager";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "core-nft",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Configuring NFT plugin");
        return new NftsManager(options);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping NFT plugin");
        return;
    },
};
