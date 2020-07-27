/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils, Identities } from "@arkecosystem/crypto";
import { CertifiedNftUpdateTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { nftRepository } from "@uns/core-nft";
import {
    INftUpdateDemand,
    NftUpdateDemandSigner,
    NftUpdateDemandHashBuffer,
    NftUpdateDemandCertificationSigner,
} from "@uns/crypto";

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

        it("should not throw for url verify", async () => {
            Managers.configManager.setHeight(900001);

            const urlCheckerUnikId = "deadbabeeb364043499c83ee6045e3395f21dbfb5f8bfe58590f59cb639ab8e1";
            const urlCheckerPassphrase = "urlcheckersecret";
            const urlCheckerAddr = Identities.Address.fromPassphrase(urlCheckerPassphrase);
            const urlCheckerWallet = new Wallets.Wallet(urlCheckerAddr);
            urlCheckerWallet.publicKey = Identities.PublicKey.fromPassphrase(urlCheckerPassphrase);
            urlCheckerWallet.setAttribute("tokens", { tokens: [urlCheckerUnikId] });
            walletManager.reindex(urlCheckerWallet);

            // Add Url checker provider authorization
            Managers.configManager.set("network.urlCheckers.unikids", [urlCheckerUnikId]);

            const properties = { "Verified/URL/MyUrl": "https://www.toto.lol" };
            const updateDemand: INftUpdateDemand = {
                nft: {
                    unik: {
                        tokenId: Fixtures.tokenId,
                        properties,
                    },
                },
                demand: {
                    payload: {
                        iss: Fixtures.tokenId,
                        sub: Fixtures.tokenId,
                        iat: 1579165954,
                        cryptoAccountAddress: senderWallet.address,
                    },
                    signature: "",
                },
            };

            let signature = new NftUpdateDemandSigner(updateDemand).sign(Fixtures.ownerPassphrase);
            updateDemand.demand.signature = signature;

            const hash = new NftUpdateDemandHashBuffer(updateDemand).getPayloadHashBuffer();

            const urlCheckDemandCertificationPayload = {
                sub: hash,
                iss: urlCheckerUnikId,
                iat: 12345678,
                cost: Utils.BigNumber.ZERO,
            };

            signature = new NftUpdateDemandCertificationSigner(urlCheckDemandCertificationPayload).sign(
                urlCheckerPassphrase,
            );

            const certification = {
                payload: urlCheckDemandCertificationPayload,
                signature,
            };
            jest.spyOn(nftRepository(), "findById").mockResolvedValueOnce({
                tokenId: urlCheckerUnikId,
                ownerId: urlCheckerAddr,
            });
            builder = Fixtures.unsCertifiedNftUpdateTransaction(certification, updateDemand, urlCheckerAddr);

            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).toResolve();
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
