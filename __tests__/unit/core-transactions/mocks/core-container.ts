import { database } from "./database";
import { nft } from "./nft";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: () => {
                        return {
                            immutableProp: {
                                constraints: ["immutable"],
                            },
                            boundedNumberProp: {
                                constraints: [{ name: "type", parameters: { type: "number", min: 3, max: 4 } }],
                            },
                            enumerationProp: {
                                constraints: [{ name: "enumeration", parameters: { values: ["1", "2"] } }],
                            },
                        };
                    },
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

                if (name === "nft") {
                    return nft;
                }

                return {};
            },
        },
    };
});
