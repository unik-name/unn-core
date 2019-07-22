import { Container, Logger, NFT } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { NFTManager } from "./managers";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "nft",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("[💎] Starting NFT Manager");
        return new NFTManager().startListening();
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("[💎] Stopping NFT Manager");
        container.resolvePlugin<NFT.INFTManager>("nft").stopListening();
        return;
    },
};
