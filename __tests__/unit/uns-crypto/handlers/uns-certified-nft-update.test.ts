/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils, Identities } from "@arkecosystem/crypto";
import { CertifiedNftUpdateTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { nftRepository } from "@uns/core-nft";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { CertifiedNftUpdateTransaction } from "@uns/crypto";

let handler;
let transaction;
let senderWallet: State.IWallet;
let forgeFactoryWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;
let tokenId;
let senderPassphrase;
const serviceCost = Utils.BigNumber.make(123456);

describe("CertifiedNtfUpdate Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(CertifiedNftUpdateTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftUpdateTransactionHandler();
        walletManager = new Wallets.WalletManager();
        tokenId = generateNftId();
        senderPassphrase = "the sender passphrase" + tokenId.substr(0, 10);
        senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        senderWallet.balance = CertifiedNftUpdateTransaction.staticFee().plus(serviceCost);
        senderWallet.setAttribute("tokens", { [tokenId]: { type: 2 } });
        walletManager.reindex(senderWallet);

        const issuerPubKey = Fixtures.issKeys.publicKey;
        forgeFactoryWallet = new Wallets.Wallet(Fixtures.issuerAddress);
        forgeFactoryWallet.publicKey = issuerPubKey;
        walletManager.reindex(forgeFactoryWallet);

        jest.spyOn(nftRepository(), "findById").mockResolvedValue({
            tokenId: Fixtures.issUnikId,
            ownerId: Fixtures.issuerAddress,
        });

        const properties = {
            myProperty: "OhMyProperty",
            mySecondProperty: "Oh_My.Prop&rty",
        };

        transaction = NFTTransactionFactory.nftCertifiedUpdate(
            tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
        ).build()[0];
        // Allow Fixtures.tokenId to update unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw ", async () => {
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });

        it("should not throw for url verify before milestone", async () => {
            const properties = {
                "Verified/URL/MyUrl": "https://www.toto.lol",
                "Verified/URL/MyUrl/proof":
                    '{"iat":1598434813,"exp":1598694013,"jti":"SyjfEteA8tSAPRjV4b_lw","sig":"jwtSignature"}',
            };

            transaction = NFTTransactionFactory.nftCertifiedUpdate(
                tokenId,
                senderPassphrase,
                Fixtures.issUnikId,
                Fixtures.issPassphrase,
                properties,
                serviceCost,
            ).build()[0];
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });

        it("should not throw for url verify after milestone", async () => {
            const height = Managers.configManager.getMilestones().find(milestone => !!milestone.urlCheckers).height;
            Managers.configManager.setHeight(height);
            const urlCheckerUnikId = generateNftId();
            const urlCheckerPassphrase = "urlcheckersecret";
            const urlCheckerWallet = walletManager.findByAddress(
                Identities.Address.fromPassphrase(urlCheckerPassphrase),
            );
            urlCheckerWallet.publicKey = Identities.PublicKey.fromPassphrase(urlCheckerPassphrase);
            urlCheckerWallet.setAttribute("tokens", { [urlCheckerUnikId]: { type: 2 } });
            walletManager.reindex(urlCheckerWallet);

            // Allow Url checker to milestone whitelist
            Managers.configManager.getMilestone().urlCheckers.push(urlCheckerUnikId);

            jest.spyOn(nftRepository(), "findById").mockResolvedValueOnce({
                tokenId: urlCheckerUnikId,
                ownerId: Identities.Address.fromPassphrase(urlCheckerPassphrase),
            });

            const properties = {
                "Verified/URL/MyUrl": "https://www.toto.lol",
                "Verified/URL/MyUrl/proof":
                    '{"iat":1598434813,"exp":1598694013,"jti":"SyjfEteA8tSAPRjV4b_lw","sig":"jwtSignature"}',
            };

            transaction = NFTTransactionFactory.nftCertifiedUpdate(
                tokenId,
                senderPassphrase,
                urlCheckerUnikId,
                urlCheckerPassphrase,
                properties,
                serviceCost,
            ).build()[0];
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });
    });

    describe("apply", () => {
        it("should apply service costs", async () => {
            await expect(handler.apply(transaction, walletManager)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(serviceCost);
            expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("revert", () => {
        it("should revert service cost", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);
            senderWallet.setAttribute("tokens", { [tokenId]: { type: 1 } });
            senderWallet.balance = Utils.BigNumber.ZERO;
            walletManager.reindex(senderWallet);

            forgeFactoryWallet.balance = serviceCost;
            walletManager.reindex(forgeFactoryWallet);

            await expect(handler.revert(transaction, walletManager)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toStrictEqual(serviceCost.plus(transaction.data.fee));
        });
    });

    describe("custom methods", () => {
        it("checkEmptyBalance", () => {
            expect(handler.checkEmptyBalance(transaction, senderWallet)).toBeTrue();
        });
    });
});
