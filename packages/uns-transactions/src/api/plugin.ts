import { Server } from "@arkecosystem/core-api";
import { Container, Logger } from "@arkecosystem/core-interfaces";
import * as Hapi from "@hapi/hapi";
import { registerPlugin } from "./delegates";

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../../package.json"),
    alias: "uns-transactions-api",
    async register(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Configuring UNS Transactions API plugin");

        // Register api overloads
        const coreServer: Server = container.resolvePlugin<Server>("api");
        const httpServer: Hapi.Server = coreServer.instance("http");
        const httpsServer: Hapi.Server = coreServer.instance("https");

        registerPlugin(httpServer);
        registerPlugin(httpsServer);
    },
    async deregister(container: Container.IContainer, options) {
        container.resolvePlugin<Logger.ILogger>("logger").info("Stopping UNS Transactions API plugin");
        return;
    },
};
