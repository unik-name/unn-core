import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { NFTManager } from "./manager";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "nft",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Starting NFT Manager 💎");
        return new NFTManager(options).start();
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping NFT Manager 💎");
        return container.resolvePlugin("nft").stop();
    },
};
