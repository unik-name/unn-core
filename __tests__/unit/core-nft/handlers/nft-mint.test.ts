/* tslint:disable:ordered-imports*/
import "jest-extended";
import "./mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler } from "../../../../packages/core-nft/src/transactions/";
import { Builders } from "@uns/core-nft-crypto";
import { INftWalletAttributes } from "@uns/core-nft/src/interfaces";
import { propertiesAssets } from "../__fixtures__";
import { NftOwnedError, NftPropertyTooLongError } from "@uns/core-nft/src/errors";
import { InvalidTransactionBytesError } from "@arkecosystem/crypto/dist/errors";

let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;
const nftName = "myNft";
const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

describe("should nft transaction handlers", () => {
    Managers.configManager.setFromPreset("testnet");

    Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);

    beforeEach(() => {
        walletManager = new Wallets.WalletManager();

        senderWallet = new Wallets.Wallet("ANBkoGqWeTSiaEVgVzSKZd3jS7UWzv9PSo");
        senderWallet.balance = Utils.BigNumber.make("50000000000");
        senderWallet.publicKey = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
        walletManager.reindex(senderWallet);
    });

    describe("should test nft Mint Transaction handler", () => {
        let nftMintbuilder: Builders.NftMintBuilder;
        let nftMinthandler: NftMintTransactionHandler;
        let nftMintTransaction;

        beforeEach(() => {
            nftMintbuilder = new Builders.NftMintBuilder(nftName, TOKEN_ID);
            nftMintTransaction = nftMintbuilder
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            nftMinthandler = new NftMintTransactionHandler();
        });

        // TODO: uns : unskip this test
        it("should pass all handler methods", async () => {
            await expect(
                nftMinthandler.throwIfCannotBeApplied(nftMintTransaction.build(), senderWallet, walletManager),
            ).toResolve();
            await nftMinthandler.applyToSender(nftMintTransaction.build(), walletManager);
            const currentSenderWallet = senderWallet.getAttribute<INftWalletAttributes>("tokens");
            expect(currentSenderWallet.tokens).toStrictEqual([TOKEN_ID]);

            await nftMinthandler.revertForSender(nftMintTransaction.build(), walletManager);
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
        });

        for (const propertiesAsset of propertiesAssets) {
            // TODO: uns : unskip this test + identify each test case in for loop
            it("should pass all handler methods, with properties", async () => {
                const transaction = nftMintTransaction.properties(propertiesAsset).build();
                await expect(
                    nftMinthandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
                ).toResolve();

                await nftMinthandler.applyToSender(transaction, walletManager);
                const currentSenderWallet = senderWallet.getAttribute<INftWalletAttributes>("tokens");
                expect(currentSenderWallet.tokens).toStrictEqual([TOKEN_ID]);

                await nftMinthandler.revertForSender(transaction, walletManager);
                expect(senderWallet.hasAttribute("tokens")).toBeFalse();
            });
        }

        it("should fail due to token already owned", async () => {
            await nftMinthandler.applyToSender(
                nftMintTransaction.properties(propertiesAssets[0]).build(),
                walletManager,
            );
            nftMintTransaction.nonce("2");
            await expect(nftMinthandler.applyToSender(nftMintTransaction.build(), walletManager)).rejects.toThrowError(
                new NftOwnedError(TOKEN_ID),
            );
        });

        it("should fail due to property value too long", async () => {
            const tooLongProperty = {
                oneProperty: "tatapwet",
                oneLongProperty:
                    "💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎",
            };
            const transaction = nftMintTransaction.properties(tooLongProperty).build();
            await expect(
                nftMinthandler.throwIfCannotBeApplied(transaction, senderWallet, walletManager),
            ).rejects.toThrowError(new NftPropertyTooLongError("oneLongProperty"));
        });

        it("should fail due to property key too long", async () => {
            const tooLongProperty = {
                oneProperty: "tatapwet",
                "💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎💎":
                    "value",
            };
            expect(() => {
                nftMintTransaction.properties(tooLongProperty).build();
            }).toThrowError(new InvalidTransactionBytesError("Illegal range: 0 <= 123 <= 4294942827 <= 448"));
        });

        describe("NFT properties schema validation", () => {
            it("should reject transaction with too long property value", async () => {
                const tooLongProperty = {
                    oneProperty: "tatapwet",
                    oneLongProperty:
                        'I have a dream that one day this nation will rise up and live out the true meaning of its creed: "We hold these truths to be self-evident: that all men are created equal." I have a dream that one day on the red hills of Georgia the sons of former slaves and the sons of former slaveowners will be able to sit down together at a table of brotherhood. I have a dream that one day even the state of Mississippi, a desert state, sweltering with the heat of injustice and oppression, will be transformed into an oasis of freedom and justice. I have a dream that my four children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character. I have a dream today',
                };
                const transaction = nftMintTransaction.properties(tooLongProperty).getStruct();
                expect(() => {
                    Transactions.TransactionFactory.fromData(transaction);
                }).toThrow(
                    `data.asset.nft['myNft'].properties['oneLongProperty'] should NOT be longer than 255 characters`,
                );
            });

            it("should reject transaction with too long property key", async () => {
                const tooLongProperty = {
                    oneProperty: "tatapwet",
                    'I have a dream that one day this nation will rise up and live out the true meaning of its creed: "We hold these truths to be self-evident: that all men are created equal." I have a dream that one day on the red hills of Georgia the sons of former slaves and the sons of former slaveowners will be able to sit down together at a table of brotherhood. I have a dream that one day even the state of Mississippi, a desert state, sweltering with the heat of injustice and oppression, will be transformed into an oasis of freedom and justice. I have a dream that my four children will one day live in a nation where they will not be judged by the color of their skin but by the content of their character. I have a dream today':
                        "value",
                };
                const transaction = nftMintTransaction.properties(tooLongProperty).getStruct();
                expect(() => {
                    Transactions.TransactionFactory.fromData(transaction);
                }).toThrow(`data.asset.nft['myNft'].properties should NOT be longer than 255 characters`);
            });
        });
    });
});
