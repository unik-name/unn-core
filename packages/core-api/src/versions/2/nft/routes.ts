import Hapi from "hapi";
import { NftController } from "./controller";
import * as Schema from "./schema";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new NftController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/nfts",
        handler: controller.index,
        options: {
            validate: Schema.index,
        },
    });

    server.route({
        method: "GET",
        path: "/nfts/{id}",
        handler: controller.show,
        options: {
            validate: Schema.show,
        },
    });

    server.route({
        method: "POST",
        path: "/nfts/search",
        handler: controller.search,
        options: {
            validate: Schema.search,
        },
    });
}
