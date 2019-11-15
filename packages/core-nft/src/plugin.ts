import { Container, Logger } from "@arkecosystem/core-interfaces";
import { ConstraintsManager } from "./constraints/manager";
import { defaults } from "./defaults";
import { IConstraintsConfig } from "./interfaces";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "nft",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Configuring NFT plugin");
        return new ConstraintsManager(options.constraints as IConstraintsConfig); // TODO: uns : validate config
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping NFT plugin");
        return;
    },
};
