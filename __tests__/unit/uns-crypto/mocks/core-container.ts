import { Wallets } from "@arkecosystem/core-state";
import { Managers } from "@arkecosystem/crypto";
import { blockchain } from "../../core-blockchain/mocks/blockchain";
import { coreNft } from "./core-nft";
import { nftDatabase } from "./database";

export const blocksBusinessRepository = {
    findById: jest.fn(),
};

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
                if (name === "database") {
                    const requiredDelegates = Managers.configManager.getMilestone().activeDelegates + 1;
                    return {
                        walletManager: {
                            allByUsername: jest
                                .fn()
                                .mockReturnValue(
                                    new Array(requiredDelegates).fill(
                                        new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo"),
                                    ),
                                ),
                        },
                        blocksBusinessRepository,
                    };
                }
                if (name === "blockchain") {
                    return blockchain;
                }
                return {};
            },
            has: () => false,
        },
    };
});
