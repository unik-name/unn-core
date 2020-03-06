import "jest-extended";
import "../mocks/core-container";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import { Builders } from "@uns/core-nft-crypto";
import { NftOwnerError, NftPropertyTooLongError } from "@uns/core-nft/src/";
import { NftUpdateTransactionHandler } from "@uns/core-nft/src/transactions";
import * as Fixtures from "../__fixtures__";

describe("Nft update handler", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Handlers.Registry.registerTransactionHandler(NftUpdateTransactionHandler);

    let nftUpdateHandler: NftUpdateTransactionHandler;
    let builder: Builders.NftUpdateBuilder;
    let walletManager: Wallets.WalletManager;
    let senderWallet: Wallets.Wallet;

    beforeEach(() => {
        nftUpdateHandler = new NftUpdateTransactionHandler();
        builder = new Builders.NftUpdateBuilder(Fixtures.nftName, Fixtures.nftId);
        walletManager = new Wallets.WalletManager();
        senderWallet = Fixtures.wallet();
        senderWallet.setAttribute("tokens", { tokens: [Fixtures.nftId] });
        walletManager.reindex(senderWallet);
    });

    describe("can be applied", () => {
        it("should fail because sender doesn't have attribute tokens", () => {
            senderWallet.forgetAttribute("tokens");
            walletManager.reindex(senderWallet);

            const transaction = builder
                .properties({ foo: "true" })
                .nonce("1")
                .sign(Fixtures.walletPassphrase)
                .build();

            return expect(
                nftUpdateHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftOwnerError);
        });

        it("should fail because sender doesn't own token", () => {
            const fakeToken = Fixtures.nftId.replace("e", "a");
            senderWallet.setAttribute("tokens", { tokens: [fakeToken] });
            walletManager.reindex(senderWallet);

            const transaction = builder
                .properties({ foo: "true" })
                .nonce("1")
                .sign(Fixtures.walletPassphrase)
                .build();

            return expect(
                nftUpdateHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftOwnerError);
        });

        it("should pass all checks", () => {
            const transaction = builder
                .properties({ foo: "true" })
                .nonce("1")
                .sign(Fixtures.walletPassphrase)
                .build();

            return expect(
                nftUpdateHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).resolves.toBeUndefined();
        });

        it("should fail because property value (in bytes) is too long", () => {
            const transaction = builder
                .properties({ foo: Fixtures.tooLongPropertyValue })
                .nonce("1")
                .sign(Fixtures.walletPassphrase)
                .build();

            return expect(
                nftUpdateHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftPropertyTooLongError);
        });
    });
});
