/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { blockchain } from "../../core-blockchain/mocks/blockchain";
import { getUnikOwnerAddress } from "@uns/uns-transactions";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { nftRepository } from "@uns/core-nft";
import { UnsTransactionType } from "@uns/crypto";
import { Identities, Interfaces } from "@arkecosystem/crypto";
import { blocksBusinessRepository } from "../mocks/core-container";

const nftRepo = nftRepository();
const senderPassphrase = "senderz passphrase";
const senderPublicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
const senderAddress = Identities.Address.fromPublicKey(senderPublicKey);
const lastblockHeight = 10;

describe("Transaction helpers tests", () => {
    describe("getUnikOwnerAddress", () => {
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
            expect(await getUnikOwnerAddress(generateNftId(), lastblockHeight)).toEqual(senderAddress);
        });

        it("should retrieve unik owner. Minted + transferred", async () => {
            const recipientPassphrase = "new owner passphrase";
            const recipientPublicKey = Identities.PublicKey.fromPassphrase(recipientPassphrase);
            const recipientAddress = Identities.Address.fromPublicKey(recipientPublicKey);
            const mintTransaction = {
                type: UnsTransactionType.UnsCertifiedNftMint,
                senderPublicKey,
            } as Interfaces.ITransactionData;
            const transferTransaction = {
                type: UnsTransactionType.UnsCertifiedNftTransfer,
                recipientId: recipientAddress,
                blockId: "blockId",
            } as Interfaces.ITransactionData;

            jest.spyOn(nftRepo, "findTransactionsByAsset").mockResolvedValueOnce([
                mintTransaction,
                transferTransaction,
            ]);
            blocksBusinessRepository.findById.mockResolvedValueOnce({
                height: lastblockHeight,
            } as Interfaces.IBlockData);

            expect(await getUnikOwnerAddress(generateNftId(), lastblockHeight)).toEqual(recipientAddress);
        });

        it("should retrieve unik owner before transfer", async () => {
            const newOwnerAddr = "newOwneraddr";
            const mintTransaction = {
                type: UnsTransactionType.UnsCertifiedNftMint,
                senderPublicKey,
            } as Interfaces.ITransactionData;
            const transferTransaction = {
                type: UnsTransactionType.UnsCertifiedNftTransfer,
                recipientId: newOwnerAddr,
                blockId: "blockId",
            } as Interfaces.ITransactionData;

            jest.spyOn(nftRepo, "findTransactionsByAsset").mockResolvedValueOnce([
                mintTransaction,
                transferTransaction,
            ]);
            blocksBusinessRepository.findById.mockResolvedValueOnce({
                height: lastblockHeight,
            } as Interfaces.IBlockData);

            expect(await getUnikOwnerAddress(generateNftId(), 9)).toEqual(senderAddress);
        });
    });
});
