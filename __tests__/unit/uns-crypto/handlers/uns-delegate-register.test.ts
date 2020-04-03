/* tslint:disable:ordered-imports*/
import "jest-extended";
import "../mocks/core-container";
import { app } from "@arkecosystem/core-container";
import { Utils, Identities, Managers } from "@arkecosystem/crypto";
import { Errors, DelegateRegisterTransactionHandler, DELEGATE_BADGE } from "@uns/uns-transactions";
import { UNSDelegateRegisterBuilder } from "@uns/crypto";
import { State } from "@arkecosystem/core-interfaces";
import * as Fixtures from "../__fixtures__";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { EXPLICIT_PROP_KEY } from "@uns/uns-transactions/src/handlers/utils/helpers";
import { NftOwnerError } from "@uns/core-nft";
import { CryptoAccountHasSeveralUniksError } from "@uns/uns-transactions/dist/errors";

let transaction;
let handler: DelegateRegisterTransactionHandler;
let builder: UNSDelegateRegisterBuilder;
let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("UnsDelegateRegister Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    const nftManager = app.resolvePlugin("core-nft");

    Handlers.Registry.registerTransactionHandler(DelegateRegisterTransactionHandler);

    const DEMANDER_PASSPHRASE = "owner passphrase";
    const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
    const properties = [
        { key: "type", value: "2" },
        { key: EXPLICIT_PROP_KEY, value: "tatalol" },
    ];
    beforeEach(async () => {
        /* Init builder & handler */
        builder = new UNSDelegateRegisterBuilder();
        handler = new DelegateRegisterTransactionHandler();

        /* Init walletManager */
        const demanderPubKey = Identities.PublicKey.fromPassphrase(DEMANDER_PASSPHRASE);
        const demanderAddress = Identities.Address.fromPublicKey(demanderPubKey);
        senderWallet = new Wallets.Wallet(demanderAddress);
        senderWallet.balance = Utils.BigNumber.make("5000000000");
        senderWallet.publicKey = demanderPubKey;
        senderWallet.setAttribute("tokens", { tokens: [TOKEN_ID] });
        walletManager = new Wallets.WalletManager();
        walletManager.reindex(senderWallet);

        /* Build transaction */
        transaction = builder
            .usernameAsset(TOKEN_ID)
            .nonce("1")
            .sign(DEMANDER_PASSPHRASE);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            nftManager.getProperties.mockReturnValueOnce(properties);
            await expect(handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager)).toResolve();
            expect(nftManager.getProperties).toHaveBeenCalledWith(TOKEN_ID);
        });

        it("should not throw for unik of type network whitelisted", async () => {
            const properties = [
                { key: "type", value: "3" },
                { key: EXPLICIT_PROP_KEY, value: "unsBounty" },
            ];
            nftManager.getProperties.mockReturnValueOnce(properties);
            const whiteListedUnik = Managers.configManager.get("network.delegateWhitelistUniks")[0];
            senderWallet.setAttribute("tokens", { tokens: [whiteListedUnik] });
            walletManager.reindex(senderWallet);
            transaction = builder
                .usernameAsset(whiteListedUnik)
                .nonce("1")
                .sign(DEMANDER_PASSPHRASE);
            await expect(handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager)).toResolve();
            expect(nftManager.getProperties).toHaveBeenCalledWith(whiteListedUnik);
        });

        it("should throw NftOwnerError", async () => {
            transaction.usernameAsset("deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef");
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(NftOwnerError);
        });

        it("should throw UnikNameNotDisclosedError", async () => {
            nftManager.getProperties.mockReturnValueOnce([]);
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(Errors.UnikNameNotDisclosedError);
        });

        it("should throw InvalidUnikTypeError", async () => {
            nftManager.getProperties.mockReturnValueOnce([
                { key: "type", value: "3" },
                { key: EXPLICIT_PROP_KEY, value: "tatalol" },
            ]);
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(Errors.InvalidUnikTypeError);
        });

        it("should throw CryptoAccountHasSeveralUniksError", async () => {
            senderWallet.setAttribute("tokens", { tokens: [TOKEN_ID, "anotherTokenId"] });
            walletManager.reindex(senderWallet);
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(CryptoAccountHasSeveralUniksError);
        });
    });

    describe("apply", () => {
        it("should set delegate.username", async () => {
            nftManager.getProperties.mockReturnValueOnce(properties);
            await expect(handler.apply(transaction.build(), walletManager)).toResolve();
            expect(senderWallet.getAttribute("delegate.username")).toBe(TOKEN_ID);
        });

        it("should set delegate Badge", async () => {
            nftManager.getProperties.mockReturnValueOnce(properties);
            await expect(handler.apply(transaction.build(), walletManager, true)).toResolve();
            expect(nftManager.manageProperties).toHaveBeenCalledWith({ [DELEGATE_BADGE]: "true" }, TOKEN_ID);
        });
    });

    describe("revert", () => {
        it("should unset delegate.username", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);

            await expect(handler.revert(transaction.build(), walletManager)).toResolve();

            expect(senderWallet.nonce.isZero()).toBeTrue();
            expect(senderWallet.getAttribute("delegate.username")).toBeUndefined();
        });

        it("should unset delegate Badge", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);
            await expect(handler.revert(transaction.build(), walletManager, true)).toResolve();
            expect(nftManager.deleteProperty).toHaveBeenCalledWith(DELEGATE_BADGE, TOKEN_ID);
        });
    });
});
