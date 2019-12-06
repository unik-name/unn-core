import { databaseManager } from "../../core-nft/mocks/database-manager";
import { coreNft } from "./core-nft";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                if (name === "logger") {
                    return {
                        info: console.log,
                        warn: console.log,
                        error: console.error,
                        debug: console.log,
                    };
                }

                if (name === "core-nft") {
                    return coreNft;
                }

                if (name === "database-manager") {
                    return databaseManager;
                }
                return {};
            },
        },
    };
});
