/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Identities, Utils } from "@arkecosystem/crypto";
import { CertifiedNftMintTransactionHandler, Errors as unsErrors } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { Errors } from "@arkecosystem/core-transactions";
import * as transactionHelpers from "@uns/uns-transactions/dist/handlers/utils";

let handler;
let builder;
let senderWallet: Wallets.Wallet;
let forgeFactoryWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("CertifiedNtfMint Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(CertifiedNftMintTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftMintTransactionHandler();
        walletManager = new Wallets.WalletManager();
        senderWallet = Fixtures.wallet();
        walletManager.reindex(senderWallet);

        forgeFactoryWallet = new Wallets.Wallet(Fixtures.issuerAddress);
        forgeFactoryWallet.publicKey = Fixtures.issKeys.publicKey;
        walletManager.reindex(forgeFactoryWallet);

        builder = Fixtures.unsCertifiedNftMintTransaction();

        // Allow Fixtures.tokenId to forge unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);
    });

    describe("throwIfCannotBeApplied", () => {
        beforeEach(() => {
            jest.spyOn(transactionHelpers, "getUnikOwner").mockResolvedValueOnce(Fixtures.issKeys.publicKey);
        });

        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).toResolve();
        });

        it("should not throw with cost = 0", async () => {
            const nftMintDemandCertificationPayload = {
                sub: "78df95c0eb364043499c83ee6045e3395f21dbfb5f8bfe58590f59cb639ab8e1", // 32 bytes
                iss: Fixtures.issUnikId,
                iat: 12345678,
                cost: Utils.BigNumber.ZERO,
            };
            const certification = {
                payload: nftMintDemandCertificationPayload,
                signature:
                    "3045022100baf5775e078d4c4ef805c06c885b407b6cd3354dd65888e6bfffde230b59f76102204bf4dd10eb5332f6175348d007bf27cbc58d8e366a143bd23beca852eb02a583",
            };
            builder = Fixtures.unsCertifiedNftMintTransaction(certification);

            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).toResolve();
        });

        it("should throw NftCertificationBadSignatureError payload modification", async () => {
            // Payload hacking attempt
            builder.data.asset.certification.payload.iat = 666666;
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                unsErrors.NftCertificationBadSignatureError,
            );
            // restore builder
            builder.data.asset.certification.payload.iat = Fixtures.certifIat;
        });

        it("should throw NftCertificationBadPayloadSubjectError asset Nft Demand modification", async () => {
            // Payload hacking attempt
            builder.data.asset.nft.unik.tokenId = "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                unsErrors.NftCertificationBadPayloadSubjectError,
            );
            // restore builder
            builder.data.asset.nft.unik.tokenId = Fixtures.tokenId;
        });

        it("should throw InsufficientBalanceError", async () => {
            senderWallet.balance = Utils.BigNumber.make("10000000");
            walletManager.reindex(senderWallet);
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                Errors.InsufficientBalanceError,
            );
        });

        // Amount is deducted from builder.data.asset.certification.payload.cost when deserializing. It should be impossible to fake it.
        it("should resolve with faked amount NftTransactionParametersError for amount", async () => {
            builder.data.amount = Utils.BigNumber.make("0");
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).toResolve();
        });

        it("should throw NftTransactionParametersError for recipient", async () => {
            builder.data.recipientId = Identities.Address.fromPassphrase("trololol");
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                unsErrors.NftTransactionParametersError,
            );
        });
    });

    describe("custom methods", () => {
        it("checkEmptyBalance", async () => {
            expect(await handler.checkEmptyBalance(builder.build())).toBeTrue();
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
            senderWallet.setAttribute("tokens", { [Fixtures.nftMintDemand.payload.sub]: { type: 2 } });
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
