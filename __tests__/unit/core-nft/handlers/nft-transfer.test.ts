import "jest-extended";
import "../mocks/core-container";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import { Builders } from "@uns/core-nft-crypto";
import { NftOwnerError } from "../../../../packages/core-nft/src/";
import { NftTransferTransactionHandler } from "../../../../packages/core-nft/src/transactions";
import * as Fixtures from "../__fixtures__";

describe("Nft transfer handler", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Handlers.Registry.registerTransactionHandler(NftTransferTransactionHandler);

    let nftTransferHandler: NftTransferTransactionHandler;
    let builder: Builders.NftTransferBuilder;
    let walletManager: Wallets.WalletManager;
    let senderWallet: Wallets.Wallet;
    const recipientAddress = "D6gDk2j9xn71GCWSt4h6qJ383cDJdB5LqH";
    let recipientWallet: Wallets.Wallet;
    let transaction;

    beforeEach(() => {
        nftTransferHandler = new NftTransferTransactionHandler();
        builder = new Builders.NftTransferBuilder(Fixtures.nftName, Fixtures.nftId);
        walletManager = new Wallets.WalletManager();
        senderWallet = Fixtures.wallet();
        senderWallet.setAttribute("tokens", { tokens: [Fixtures.nftId] });
        walletManager.reindex(senderWallet);
        recipientWallet = new Wallets.Wallet(recipientAddress);
        walletManager.reindex(recipientWallet);

        transaction = builder
            .recipientId(recipientAddress)
            .nonce("1")
            .sign(Fixtures.walletPassphrase)
            .build();
    });

    describe("can be applied", () => {
        it("should fail because sender doesn't have attribute tokens", () => {
            senderWallet.forgetAttribute("tokens");
            walletManager.reindex(senderWallet);

            return expect(
                nftTransferHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftOwnerError);
        });

        it("should fail because sender doesn't own token", () => {
            const fakeToken = Fixtures.nftId.replace("e", "a");
            senderWallet.setAttribute("tokens", { tokens: [fakeToken] });
            walletManager.reindex(senderWallet);

            return expect(
                nftTransferHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftOwnerError);
        });

        it("should pass because sender owns token", () => {
            return expect(
                nftTransferHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).resolves.toBeUndefined();
        });
    });

    describe("applyToSender", () => {
        it("should not fail", async () => {
            expect(senderWallet.hasAttribute("tokens")).toBeTrue();
            await expect(nftTransferHandler.applyToSender(transaction, walletManager)).toResolve();
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
        });
    });

    describe("applyToRecipient", () => {
        it("should not fail", async () => {
            expect(recipientWallet.hasAttribute("tokens")).toBeFalse();
            await expect(nftTransferHandler.applyToRecipient(transaction, walletManager)).toResolve();
            expect(recipientWallet.hasAttribute("tokens")).toBeTrue();
        });
    });

    describe("revert", () => {
        beforeEach(() => {
            senderWallet.forgetAttribute("tokens");
            walletManager.reindex(senderWallet);
            recipientWallet.setAttribute("tokens", { tokens: [Fixtures.nftId] });
            walletManager.reindex(recipientWallet);

            transaction = builder
                .recipientId(recipientAddress)
                .nonce("0")
                .sign(Fixtures.walletPassphrase)
                .build();
        });

        it("revertForSender should not fail", async () => {
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
            await expect(nftTransferHandler.revertForSender(transaction, walletManager)).toResolve();
            expect(senderWallet.hasAttribute("tokens")).toBeTrue();
        });

        it("revertForRecipient should not fail", async () => {
            expect(recipientWallet.hasAttribute("tokens")).toBeTrue();
            await expect(nftTransferHandler.revertForRecipient(transaction, walletManager)).toResolve();
            expect(recipientWallet.hasAttribute("tokens")).toBeFalse();
        });
    });
});
