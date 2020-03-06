import { Server } from "@arkecosystem/core-api";
import { Container } from "@arkecosystem/core-interfaces";
import * as Hapi from "@hapi/hapi";
import { defaults } from "./defaults";
import { registerPlugin } from "./plugin-utils";
import { IRoute, IRoutesManager } from "./routes";

interface IBadgesPluginOptions extends Container.IPluginOptions {
    routes: IRoute[];
}

export const plugin: Container.IPluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "badges",
    async register(container: Container.IContainer, options: IBadgesPluginOptions) {
        const routesManager = new IRoutesManager(options.routes);

        const coreServer: Server = container.resolvePlugin<Server>("api");

        const httpServer: Hapi.Server = coreServer.instance("http");
        const httpsServer: Hapi.Server = coreServer.instance("https");

        registerPlugin(container, httpServer, routesManager);
        registerPlugin(container, httpsServer, routesManager);
    },
};
