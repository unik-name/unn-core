import { Container, Logger } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { DelegateRegisterTransactionHandler, DiscloseExplicitTransactionHandler } from "./handlers";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    alias: "uns-transactions",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Configuring UNS Transactions plugin");
        // Register transactions
        Handlers.Registry.registerTransactionHandler(DiscloseExplicitTransactionHandler);
        Handlers.Registry.registerTransactionHandler(DelegateRegisterTransactionHandler);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping UNS Transactions plugin");
        return;
    },
};
