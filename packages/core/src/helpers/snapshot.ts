import { app } from "@arkecosystem/core-container";
import { Container } from "@arkecosystem/core-interfaces";

// tslint:disable-next-line:no-var-requires
const { version } = require("../../package.json");

export async function setUpLite(options): Promise<Container.IContainer> {
    await app.setUp(version, options, {
        include: [
            "@uns/core-event-emitter",
            "@uns/core-logger-pino",
            "@uns/core-database-postgres",
            "@uns/core-snapshots",
        ],
    });

    return app;
}
