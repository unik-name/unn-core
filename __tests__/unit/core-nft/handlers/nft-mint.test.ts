import "jest-extended";
import "../mocks/core-container";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import { Builders } from "@uns/core-nft-crypto";
import { NftOwnedError, NftPropertyTooLongError } from "@uns/core-nft/src/";
import { NftMintTransactionHandler } from "@uns/core-nft/src/transactions";
import * as Fixtures from "../__fixtures__";

describe("Nft mint handler", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);

    let nftMintHandler: NftMintTransactionHandler;
    let builder: Builders.NftMintBuilder;
    let walletManager: Wallets.WalletManager;
    let senderWallet: Wallets.Wallet;

    beforeEach(() => {
        nftMintHandler = new NftMintTransactionHandler();
        builder = new Builders.NftMintBuilder(Fixtures.nftName, Fixtures.nftId);
        walletManager = new Wallets.WalletManager();
        senderWallet = Fixtures.wallet();
        walletManager.reindex(senderWallet);
    });

    describe("can be applied", () => {
        it("should fail because token is already owned", () => {
            const ownerWallet = new Wallets.Wallet("D6gDk2j9xn71GCWSt4h6qJ383cDJdB5LqH");
            ownerWallet.setAttribute("tokens", { tokens: [Fixtures.nftId] });
            walletManager.reindex(ownerWallet);

            const transaction = builder
                .nonce("1")
                .sign(Fixtures.walletPassphrase)
                .build();

            return expect(
                nftMintHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftOwnedError);
        });

        it("should pass all checks", () => {
            const transaction = builder
                .properties({ foo: "true" })
                .nonce("1")
                .sign(Fixtures.walletPassphrase)
                .build();

            return expect(
                nftMintHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).resolves.toBeUndefined();
        });

        it("should fail because property value (in bytes) is too long", () => {
            const transaction = builder
                .properties({ foo: Fixtures.tooLongPropertyValue })
                .nonce("1")
                .sign(Fixtures.walletPassphrase)
                .build();

            return expect(
                nftMintHandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(NftPropertyTooLongError);
        });
    });
});
