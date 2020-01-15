/* tslint:disable:ordered-imports*/
import "jest-extended";
import "../mocks/core-container";
import { app } from "@arkecosystem/core-container";
import { Utils, Identities, Managers } from "@arkecosystem/crypto";
import { DelegateResignTransactionHandler, DELEGATE_BADGE } from "@uns/uns-transactions";
import { UNSDelegateResignBuilder } from "@uns/crypto";
import { State } from "@arkecosystem/core-interfaces";
import * as Fixtures from "../__fixtures__";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { CryptoAccountNotADelegateError } from "@uns/uns-transactions/dist/errors";

let transaction;
let handler: DelegateResignTransactionHandler;
let builder: UNSDelegateResignBuilder;
let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("UnsDelegateResign Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    const nftManager = app.resolvePlugin("core-nft");

    Handlers.Registry.registerTransactionHandler(DelegateResignTransactionHandler);

    const DEMANDER_PASSPHRASE = "owner passphrase";
    const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
    beforeEach(async () => {
        /* Init builder & handler */
        builder = new UNSDelegateResignBuilder();
        handler = new DelegateResignTransactionHandler();

        /* Init walletManager */
        const demanderPubKey = Identities.PublicKey.fromPassphrase(DEMANDER_PASSPHRASE);
        const demanderAddress = Identities.Address.fromPublicKey(demanderPubKey);
        senderWallet = new Wallets.Wallet(demanderAddress);
        senderWallet.balance = Utils.BigNumber.make("5000000000");
        senderWallet.publicKey = demanderPubKey;
        senderWallet.setAttribute("delegate.username", TOKEN_ID);
        walletManager = new Wallets.WalletManager();
        walletManager.reindex(senderWallet);

        /* Build transaction */
        transaction = builder.nonce("1").sign(DEMANDER_PASSPHRASE);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            nftManager.getProperty.mockReturnValueOnce({ value: "true" });
            await expect(handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager)).toResolve();
            expect(nftManager.getProperty).toHaveBeenCalledWith(TOKEN_ID, DELEGATE_BADGE);
        });

        it("should throw CryptoAccountNotADelegateError (no username)", async () => {
            senderWallet.forgetAttribute("delegate.username");
            walletManager.reindex(senderWallet);
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(CryptoAccountNotADelegateError);
        });

        it("should throw CryptoAccountNotADelegateError (no delegate badge)", async () => {
            nftManager.getProperty.mockReturnValueOnce();
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(CryptoAccountNotADelegateError);
        });
    });

    describe("apply", () => {
        it("should set unset delegate.resigned", async () => {
            nftManager.getProperty.mockReturnValueOnce({ value: "true" });
            await expect(handler.apply(transaction.build(), walletManager)).toResolve();
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeTrue();
        });

        it("should set delegate Badge to false", async () => {
            nftManager.getProperty.mockReturnValueOnce({ value: "true" });
            await expect(handler.apply(transaction.build(), walletManager, true)).toResolve();
            expect(nftManager.manageProperties).toHaveBeenCalledWith({ [DELEGATE_BADGE]: "false" }, TOKEN_ID);
        });
    });

    describe("revert", () => {
        it("should set delegate badge truthy", async () => {
            transaction.nonce("0");
            await expect(handler.revert(transaction.build(), walletManager, true)).toResolve();
            expect(senderWallet.getAttribute<boolean>("delegate.resigned")).toBeFalsy();
            expect(nftManager.manageProperties).toHaveBeenCalledWith({ [DELEGATE_BADGE]: "true" }, TOKEN_ID);
        });
    });
});
