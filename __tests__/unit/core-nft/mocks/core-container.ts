import { databaseManager } from "./database-manager";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                if (name === "database-manager") {
                    return databaseManager;
                }

                return {};
            },
        },
    };
});
