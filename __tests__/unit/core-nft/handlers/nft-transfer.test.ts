import "jest-extended";
import "../mocks/core-container";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import { addNftToWallet, removeNftFromWallet } from "@uns/core-nft";
import { Builders } from "@uns/core-nft-crypto";
import { NftOwnerError } from "@uns/core-nft/src/";
import { NftTransferTransactionHandler } from "@uns/core-nft/src/transactions";
import * as Fixtures from "../__fixtures__";
import { nftManager } from "../mocks/core-nft";

let nftTransferHandler: NftTransferTransactionHandler;
let builder: Builders.NftTransferBuilder;
const walletManager = new Wallets.WalletManager();
let senderWallet: Wallets.Wallet;
const recipientAddress = "D6gDk2j9xn71GCWSt4h6qJ383cDJdB5LqH";
let recipientWallet: Wallets.Wallet;
let transaction;
const tokenType = 6;
let tokenAttribute;

describe("Nft transfer handler", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Handlers.Registry.registerTransactionHandler(NftTransferTransactionHandler);

    beforeEach(() => {
        nftTransferHandler = new NftTransferTransactionHandler();
        builder = new Builders.NftTransferBuilder(Fixtures.nftName, Fixtures.nftId);
        walletManager.reset();
        senderWallet = Fixtures.wallet();
        walletManager.reindex(senderWallet);

        recipientWallet = new Wallets.Wallet(recipientAddress);
        walletManager.reindex(recipientWallet);
        tokenAttribute = { [Fixtures.nftId]: { type: tokenType } };

        transaction = builder
            .recipientId(recipientAddress)
            .nonce("1")
            .sign(Fixtures.walletPassphrase)
            .build();
    });

    describe("can be applied", () => {
        it("should fail because sender doesn't have attribute tokens", () => {
            return expect(
                nftTransferHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftOwnerError);
        });

        it("should fail because sender doesn't own token", () => {
            const fakeToken = Fixtures.nftId.replace("e", "a");
            senderWallet.setAttribute("tokens", { [fakeToken]: { type: tokenType } });
            walletManager.reindex(senderWallet);

            return expect(
                nftTransferHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftOwnerError);
        });

        it("should pass because sender owns token", () => {
            senderWallet.setAttribute("tokens", tokenAttribute);
            walletManager.reindex(senderWallet);
            return expect(
                nftTransferHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).resolves.toBeUndefined();
        });
    });

    describe("applyToSender", () => {
        it("should not fail", async () => {
            senderWallet.setAttribute("tokens", tokenAttribute);
            walletManager.reindex(senderWallet);

            expect(senderWallet.hasAttribute("tokens")).toBeTrue();
            await expect(nftTransferHandler.applyToSender(transaction, walletManager)).toResolve();
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
        });
    });

    describe("applyToRecipient", () => {
        it("should not fail", async () => {
            nftManager.getProperty.mockResolvedValueOnce({ value: tokenType.toString() });
            expect(recipientWallet.hasAttribute("tokens")).toBeFalse();
            await expect(nftTransferHandler.applyToRecipient(transaction, walletManager)).toResolve();
            expect(recipientWallet.hasAttribute("tokens")).toBeTrue();
            expect(recipientWallet.getAttribute("tokens")).toEqual(tokenAttribute);
        });
    });

    describe("revert", () => {
        beforeEach(() => {
            recipientWallet.setAttribute("tokens", tokenAttribute);
            walletManager.reindex(recipientWallet);

            transaction = builder
                .recipientId(recipientAddress)
                .nonce("0")
                .sign(Fixtures.walletPassphrase)
                .build();
        });

        it("revertForSender should not fail", async () => {
            nftManager.getProperty.mockResolvedValueOnce({ value: tokenType.toString() });
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
            await expect(nftTransferHandler.revertForSender(transaction, walletManager)).toResolve();
            expect(senderWallet.hasAttribute("tokens")).toBeTrue();
            expect(senderWallet.getAttribute("tokens")).toEqual(tokenAttribute);
        });

        it("revertForRecipient should not fail", async () => {
            expect(recipientWallet.hasAttribute("tokens")).toBeTrue();
            await expect(nftTransferHandler.revertForRecipient(transaction, walletManager)).toResolve();
            expect(recipientWallet.hasAttribute("tokens")).toBeFalse();
        });
    });

    describe("add/remove nft from wallet", () => {
        it("remove -> add", async () => {
            nftManager.getProperty.mockResolvedValueOnce({ value: tokenType.toString() });
            senderWallet.setAttribute("tokens", tokenAttribute);
            walletManager.reindex(senderWallet);
            await removeNftFromWallet(senderWallet, transaction.data.asset, walletManager);
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
            await addNftToWallet(walletManager, senderWallet, Fixtures.nftId, tokenType);
            expect(senderWallet.hasAttribute("tokens")).toBeTrue();
            expect(senderWallet.getAttribute("tokens")).toEqual({ [Fixtures.nftId]: { type: tokenType } });
        });
    });
});
