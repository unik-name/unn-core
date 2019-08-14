import { database } from "./database";

const DEFAULT_CONFIG = {
    genesisProperty: {
        genesis: true,
    },
};

const configMock = jest.fn();

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: configMock,
                };
            },
            resolvePlugin: name => {
                if (name === "logger") {
                    return {
                        info: console.log,
                        warn: console.log,
                        error: console.error,
                        debug: console.log,
                    };
                }

                if (name === "database") {
                    return database;
                }

                return {};
            },
        },
    };
});

export { configMock, DEFAULT_CONFIG };
