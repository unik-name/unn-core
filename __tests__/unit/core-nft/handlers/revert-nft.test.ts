/* tslint:disable:ordered-imports*/
import "jest-extended";
import { revertProperties } from "@uns/core-nft/src/transactions/handlers/helpers";
import { testCases, NFT_NAME } from "../__fixtures__/nft-revert";
import { Interfaces } from "@arkecosystem/crypto";
import { app } from "@arkecosystem/core-container";

let nftDbMock = {};

async function manageProperties(properties, tokenId: string): Promise<any> {
    return Promise.all(
        Object.entries<string>(properties).map(async ([key, value]) => {
            if (value === null) {
                return this.deleteProperty(key, tokenId);
            } else {
                return this.insertOrUpdateProperty(key, value, tokenId);
            }
        }),
    );
}

// @ts-ignore
app.resolvePlugin = jest.fn(plugin => {
    if (plugin === "database-manager") {
        return {
            connection: () => {
                return {
                    db: {
                        nfts: {
                            findTransactionsByAsset: asset => {
                                const tokenId = asset.nft[NFT_NAME].tokenId;
                                // slice() is used here to make a working copy of the tx array
                                return testCases
                                    .find(element => element.tokenId === tokenId)
                                    .transactions.slice()
                                    .reverse();
                            },
                        },
                    },
                };
            },
        };
    }
    if (plugin === "core-nft") {
        return {
            deleteProperty: key => {
                delete nftDbMock[key];
            },
            insertOrUpdateProperty: (key, value) => {
                nftDbMock[key] = value;
            },
            manageProperties,
        };
    }
    return {};
});

describe("nft revert tests", () => {
    describe("Nft update", () => {
        beforeEach(() => {
            nftDbMock = {};
        });

        for (const testCase of testCases) {
            it(testCase.scenario, async () => {
                // set current nft state
                nftDbMock = testCase.finalProperties;
                const txToRevert = (testCase.transactions.slice(-1)[0] as unknown) as Interfaces.ITransactionData;
                await revertProperties(txToRevert);
                expect(nftDbMock).toEqual(testCase.afterRevertProperties);
            });
        }

        for (const testCase of testCases) {
            it(`${testCase.scenario} with a property added by a other transactions`, async () => {
                // set current nft state
                nftDbMock = { ...testCase.finalProperties, tata: "pwet" };
                const txToRevert = (testCase.transactions.slice(-1)[0] as unknown) as Interfaces.ITransactionData;
                await revertProperties(txToRevert);
                expect(nftDbMock).toEqual({ ...testCase.afterRevertProperties, tata: "pwet" });
            });
        }
    });
});
