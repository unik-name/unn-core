import Hapi from "@hapi/hapi";
import { NftController } from "./controller";
import * as Schema from "./schema";

export const registerRoutes = (server: Hapi.Server): void => {
    const controller = new NftController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/{nft}s",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/{nft}s/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });

    server.route({
        method: "GET",
        path: "/{nft}s/{id}/properties",
        handler: controller.properties,
        options: {
            validate: Schema.properties,
        },
    });

    server.route({
        method: "GET",
        path: "/{nft}s/{id}/properties/{key}",
        handler: controller.property,
        options: {
            validate: Schema.property,
        },
    });

    server.route({
        method: "POST",
        path: "/{nft}s/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });

    server.route({
        method: "GET",
        path: "/wallets/{id}/{nft}s",
        handler: controller.walletNfts,
        options: {
            validate: Schema.walletNfts,
        },
    });

    server.route({
        method: "GET",
        path: "/nfts/status",
        handler: controller.status,
    });
};
