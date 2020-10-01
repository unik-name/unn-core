/* tslint:disable:ordered-imports*/
import "jest-extended";
import "../mocks/core-container";
import { Utils, Identities, Managers } from "@arkecosystem/crypto";
import { UnsVoteTransactionHandler } from "@uns/uns-transactions";
import { UNSVoteBuilder, DIDTypes } from "@uns/crypto";
import { State } from "@arkecosystem/core-interfaces";
import * as Fixtures from "../__fixtures__";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { VoteUnikTypeError, NoUnikError } from "@uns/uns-transactions/dist/errors";

let transaction;
let handler: UnsVoteTransactionHandler;
let builder: UNSVoteBuilder;
let senderWallet: Wallets.Wallet;
let delegateWallet: Wallets.Wallet;
const delegateType = DIDTypes.NETWORK;
let walletManager: State.IWalletManager;

describe("UnsDelegateRegister Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(UnsVoteTransactionHandler);
    walletManager = new Wallets.WalletManager();

    const senderTokenId = "deadbabe5f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
    const delegateTokenId = "deadbeef5f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

    beforeEach(async () => {
        /* Init builder & handler */
        builder = new UNSVoteBuilder();
        handler = new UnsVoteTransactionHandler();

        /* Init walletManager */
        const passphrase = "sender passphrase";
        const senderPubKey = Identities.PublicKey.fromPassphrase(passphrase);
        const senderAddress = Identities.Address.fromPublicKey(senderPubKey);
        senderWallet = new Wallets.Wallet(senderAddress);
        senderWallet.balance = Utils.BigNumber.make("5000000000");
        senderWallet.publicKey = senderPubKey;
        senderWallet.setAttribute("tokens", { [senderTokenId]: { type: delegateType } });
        walletManager.reindex(senderWallet);

        const delegatePubKey = Identities.PublicKey.fromPassphrase("delegate passphrase");
        const delegateAddress = Identities.Address.fromPublicKey(delegatePubKey);
        delegateWallet = new Wallets.Wallet(delegateAddress);
        delegateWallet.publicKey = delegatePubKey;
        delegateWallet.setAttribute("tokens", { [delegateTokenId]: { type: 1 } });
        delegateWallet.setAttribute("delegate", { username: delegateTokenId, type: delegateType });
        walletManager.reindex(delegateWallet);

        /* Build transaction */
        transaction = builder
            .votesAsset([`+${delegatePubKey}`])
            .nonce("1")
            .sign(passphrase);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager)).toResolve();
        });

        it("should throw VoteUnikTypeError", async () => {
            senderWallet.setAttribute("tokens", { [senderTokenId]: { type: DIDTypes.INDIVIDUAL } });
            walletManager.reindex(senderWallet);

            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(VoteUnikTypeError);
        });
        it("should throw NoUnikError", async () => {
            senderWallet.setAttribute("tokens", {});
            walletManager.reindex(senderWallet);
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(NoUnikError);
        });
        it("should throw NoUnikError", async () => {
            senderWallet.forgetAttribute("tokens");
            walletManager.reindex(senderWallet);
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(NoUnikError);
        });
    });
});
