import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { NFT } from "@arkecosystem/core-interfaces";
import { configManager } from "@arkecosystem/crypto";
import "../../../../utils";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

const address = "AG8kwwk4TsYfA2HdwaWBVAJQBj6VhdcpMo";
const nftId = "ceaec02f7f3bc9cb2b75b0f3ba277989baea72d26d7776b580e3a1df90b8c331";
const txId1 = "87eec85f51e757753d6010e1c129e28a3b95293ccaa89dbf0f616a2f12e6ac11";
const txId2 = "f4096af2ea634423ade12f792c98c457e8b87940da069d2146da2f7bead23e5c";
const queryAssetExpectation = {
    nft: {
        [configManager.getCurrentNftName()]: {
            tokenId: nftId,
        },
    },
};

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - Nfts", () => {
    it("should return token id, owner and associated transactions", async () => {
        jest.spyOn(
            app.resolvePlugin<Database.IDatabaseService>("database").nftsBusinessRepository,
            "findById",
        ).mockImplementationOnce(
            (_: string): Promise<NFT.INft> => {
                return new Promise(resolve => {
                    resolve({ id: nftId, ownerId: address });
                });
            },
        );

        const nftsRepositoryMock = jest
            .spyOn(
                app.resolvePlugin<Database.IDatabaseService>("database").transactionsBusinessRepository,
                "findAllByAsset",
            )
            .mockImplementationOnce(
                (_: any): Promise<NFT.INftTx[]> => {
                    return new Promise(resolve => {
                        resolve([{ id: txId1 }, { id: txId2 }]);
                    });
                },
            );

        const response = await utils.request("GET", `nfts/${nftId}`);

        expect(response).toBeSuccessfulResponse();
        expect(response.data.data.id).toEqual(nftId);
        expect(response.data.data.ownerId).toEqual(address);
        expect(response.data.data.transactions.first.id).toEqual(txId1);
        expect(response.data.data.transactions.last.id).toEqual(txId2);
        expect(nftsRepositoryMock).toHaveBeenCalledWith(queryAssetExpectation);
    });
});
