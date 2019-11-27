/* tslint:disable:ordered-imports*/
import "jest-extended";
import "./mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { NftMintTransactionHandler } from "../../../../packages/core-nft/src/transactions/";
import { NftBuilders } from "@uns/core-nft-crypto";
import { INftWalletAttributes } from "@uns/core-nft/src/interfaces";
import { propertiesAssets } from "../helper";
import { NftOwnedError } from "@uns/core-nft/src/errors";

let handler: NftMintTransactionHandler;
let builder: NftBuilders.NftMintBuilder;

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;
const nftName = "myNft";
const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

describe("should test marketplace transaction handlers", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);

    beforeEach(() => {
        builder = new NftBuilders.NftMintBuilder(nftName, TOKEN_ID);
        handler = new NftMintTransactionHandler();
        walletManager = new Wallets.WalletManager();

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make("50000000000");
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("should test business registration handler", () => {
        it("should pass all handler methods", async () => {
            const actual = builder
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await expect(handler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager)).toResolve();
            await handler.applyToSender(actual.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<INftWalletAttributes>("tokens");
            expect(currentSenderWallet.tokens).toStrictEqual([TOKEN_ID]);

            await handler.revertForSender(actual.build(), walletManager);
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
        });

        for (const propertiesAsset of propertiesAssets) {
            it("should pass all handler methods, with properties", async () => {
                const actual = builder
                    .properties(propertiesAsset)
                    .nonce("1")
                    .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

                await expect(handler.throwIfCannotBeApplied(actual.build(), senderWallet, walletManager)).toResolve();

                await handler.applyToSender(actual.build(), walletManager);
                const currentSenderWallet = senderWallet.getAttribute<INftWalletAttributes>("tokens");
                expect(currentSenderWallet.tokens).toStrictEqual([TOKEN_ID]);

                await handler.revertForSender(actual.build(), walletManager);
                expect(senderWallet.hasAttribute("tokens")).toBeFalse();
            });
        }

        it("should fail duo to token already owned", async () => {
            const actual = builder
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");

            await handler.applyToSender(actual.build(), walletManager);

            actual.nonce("2");
            await expect(handler.applyToSender(actual.build(), walletManager)).rejects.toThrowError(
                new NftOwnedError(TOKEN_ID),
            );
        });
    });
});
