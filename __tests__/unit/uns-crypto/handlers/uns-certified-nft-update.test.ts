/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils, Identities } from "@arkecosystem/crypto";
import { CertifiedNftUpdateTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { nftRepository } from "@uns/core-nft";

let handler;
let builder;
let senderWallet: Wallets.Wallet;
let forgeFactoryWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("CertifiedNtfUpdate Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(CertifiedNftUpdateTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftUpdateTransactionHandler();
        walletManager = new Wallets.WalletManager();
        senderWallet = Fixtures.wallet();
        senderWallet.setAttribute("tokens", { tokens: [Fixtures.tokenId] });
        walletManager.reindex(senderWallet);

        const issuerPubKey = Fixtures.issKeys.publicKey;

        forgeFactoryWallet = new Wallets.Wallet(Fixtures.issuerAddress);
        forgeFactoryWallet.publicKey = issuerPubKey;
        walletManager.reindex(forgeFactoryWallet);

        jest.spyOn(nftRepository(), "findById").mockResolvedValue({
            tokenId: Fixtures.issUnikId,
            ownerId: Fixtures.issuerAddress,
        });

        builder = Fixtures.unsCertifiedNftUpdateTransaction();

        // Allow Fixtures.tokenId to update unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).toResolve();
        });

        it("should not throw for url verify before milestone", async () => {
            const transaction = Fixtures.buildUrlCheckerTransaction(
                { tokenId: Fixtures.issUnikId, address: Fixtures.issuerAddress, passphrase: Fixtures.issPassphrase },
                { tokenId: Fixtures.tokenId, address: senderWallet.address, passphrase: Fixtures.ownerPassphrase },
            );
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });

        it("should not throw for url verify after milestone", async () => {
            const height = Managers.configManager.getMilestones().find(milestone => !!milestone.urlCheckers).height;
            Managers.configManager.setHeight(height);
            const urlCheckerUnikId = "deadbabeeb364043499c83ee6045e3395f21dbfb5f8bfe58590f59cb639ab8e1";
            const urlCheckerPassphrase = "urlcheckersecret";
            const urlCheckerAddr = Identities.Address.fromPassphrase(urlCheckerPassphrase);
            const urlCheckerWallet = new Wallets.Wallet(urlCheckerAddr);
            urlCheckerWallet.publicKey = Identities.PublicKey.fromPassphrase(urlCheckerPassphrase);
            urlCheckerWallet.setAttribute("tokens", { tokens: [urlCheckerUnikId] });
            walletManager.reindex(urlCheckerWallet);

            // Allow Url checker to milestone whitelist
            Managers.configManager.getMilestone().urlCheckers.push(urlCheckerUnikId);

            jest.spyOn(nftRepository(), "findById").mockResolvedValueOnce({
                tokenId: urlCheckerUnikId,
                ownerId: urlCheckerAddr,
            });

            const transaction = Fixtures.buildUrlCheckerTransaction(
                { tokenId: urlCheckerUnikId, address: urlCheckerAddr, passphrase: urlCheckerPassphrase },
                { tokenId: Fixtures.tokenId, address: senderWallet.address, passphrase: Fixtures.ownerPassphrase },
            );
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });
    });

    describe("apply", () => {
        it("should apply service costs", async () => {
            await expect(handler.apply(builder.build(), walletManager)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(Fixtures.cost);
            expect(senderWallet.balance).toStrictEqual(
                Fixtures.walletBalance.minus(Fixtures.cost).minus(builder.data.fee),
            );
        });
    });

    describe("revert", () => {
        it("should revert service cost", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);
            senderWallet.setAttribute("tokens", { tokens: [Fixtures.nftMintDemand.payload.sub] });
            walletManager.reindex(senderWallet);
            forgeFactoryWallet.balance = Fixtures.cost;
            walletManager.reindex(forgeFactoryWallet);

            await expect(handler.revert(builder.build(), walletManager)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toStrictEqual(
                Fixtures.walletBalance.plus(Fixtures.cost).plus(builder.data.fee),
            );
        });
    });
});
