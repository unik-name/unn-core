import { coreNft } from "./core-nft";
import { nftDatabase } from "./database";

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
                    return {
                        connection: () => {
                            return {
                                db: {
                                    nfts: nftDatabase,
                                },
                            };
                        },
                    };
                }
                return {};
            },
        },
    };
});
