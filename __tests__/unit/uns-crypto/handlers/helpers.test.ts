/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { blockchain } from "../../core-blockchain/mocks/blockchain";
import { getUnikOwner } from "@uns/uns-transactions";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { nftRepository } from "@uns/core-nft";
import { UnsTransactionType } from "@uns/crypto";
import { Interfaces } from "@arkecosystem/crypto";
import { blocksBusinessRepository } from "../mocks/core-container";

const nftRepo = nftRepository();
const senderPublicKey = "senderPubKey";
const lastblockHeight = 10;

describe("Transaction helpers tests", () => {
    describe("getUnikOwner", () => {
        beforeEach(() => {
            jest.spyOn(blockchain, "getLastBlock").mockReturnValueOnce({
                data: { height: lastblockHeight },
            } as Interfaces.IBlock);
        });

        it("should retrieve unik owner. Minted only", async () => {
            const mintTransaction = {
                type: UnsTransactionType.UnsCertifiedNftMint,
                senderPublicKey,
            } as Interfaces.ITransactionData;
            jest.spyOn(nftRepo, "findTransactionsByAsset").mockResolvedValueOnce([mintTransaction]);
            expect(await getUnikOwner(generateNftId(), lastblockHeight)).toEqual(senderPublicKey);
        });

        it("should retrieve unik owner. Minted + transferred", async () => {
            const newOwnerPubKey = "newOwnerPubKey";
            const mintTransaction = {
                type: UnsTransactionType.UnsCertifiedNftMint,
                senderPublicKey,
            } as Interfaces.ITransactionData;
            const transferTransaction = {
                type: UnsTransactionType.UnsCertifiedNftTransfer,
                recipientId: newOwnerPubKey,
                blockId: "blockId",
            } as Interfaces.ITransactionData;

            jest.spyOn(nftRepo, "findTransactionsByAsset").mockResolvedValueOnce([
                mintTransaction,
                transferTransaction,
            ]);
            blocksBusinessRepository.findById.mockResolvedValueOnce({
                height: lastblockHeight,
            } as Interfaces.IBlockData);

            expect(await getUnikOwner(generateNftId(), lastblockHeight)).toEqual(newOwnerPubKey);
        });

        it("should retrieve unik owner before transfer", async () => {
            const newOwnerPubKey = "newOwnerPubKey";
            const mintTransaction = {
                type: UnsTransactionType.UnsCertifiedNftMint,
                senderPublicKey,
            } as Interfaces.ITransactionData;
            const transferTransaction = {
                type: UnsTransactionType.UnsCertifiedNftTransfer,
                recipientId: newOwnerPubKey,
                blockId: "blockId",
            } as Interfaces.ITransactionData;

            jest.spyOn(nftRepo, "findTransactionsByAsset").mockResolvedValueOnce([
                mintTransaction,
                transferTransaction,
            ]);
            blocksBusinessRepository.findById.mockResolvedValueOnce({
                height: lastblockHeight,
            } as Interfaces.IBlockData);

            expect(await getUnikOwner(generateNftId(), 9)).toEqual(senderPublicKey);
        });
    });
});
