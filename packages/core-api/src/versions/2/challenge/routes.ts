import Hapi from "hapi";
import { ChallengeController } from "./controller";

export function registerRoutes(server: Hapi.Server): void {
    const controller = new ChallengeController();
    server.bind(controller);

    server.route({
        method: "GET",
        path: "/challenge",
        handler: controller.index,
    });
}
