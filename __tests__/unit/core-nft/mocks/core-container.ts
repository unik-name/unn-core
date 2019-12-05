import { nftManager } from "./core-nft";
import { databaseManager } from "./database-manager";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                switch (name) {
                    case "database-manager":
                        return databaseManager;
                    case "core-nft":
                        return nftManager;
                    default:
                        return {};
                }
            },
        },
    };
});
