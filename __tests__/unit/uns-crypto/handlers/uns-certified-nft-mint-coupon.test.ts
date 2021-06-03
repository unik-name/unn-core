/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Identities, Utils, Interfaces } from "@arkecosystem/crypto";
import { CertifiedNftMintTransactionHandler, Errors as unsErrors } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { nftRepository } from "@uns/core-nft";
import { UNSCertifiedNftMintBuilder, getMintVoucherRewards } from "@uns/crypto";
import { buildCertifiedDemand } from "../helpers";
import * as transactionHelpers from "@uns/uns-transactions/dist/handlers/utils";

let handler;
let builder;
let senderWallet: Wallets.Wallet;
let forgeFactoryWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;
let foundationWallet: Wallets.Wallet;
const tokenId = "a99ee098dd4fd00ba513e1ca09abb8522a8ba94fa2a7a81dd674eac27ce66b94";
const passphrase = "IHaveAVoucher";

const voucherId = "6trg50ZxgEPl9Av8V67c0";

const properties = {
    type: "1",
    UnikVoucherId: voucherId,
};
let demand;

describe("CertifiedNtfMint Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(CertifiedNftMintTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftMintTransactionHandler();
        walletManager = new Wallets.WalletManager();

        forgeFactoryWallet = new Wallets.Wallet(Fixtures.issuerAddress);
        forgeFactoryWallet.publicKey = Fixtures.issKeys.publicKey;
        walletManager.reindex(forgeFactoryWallet);

        senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(passphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
        walletManager.reindex(senderWallet);

        // Allow Fixtures.issUnikId to forge unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);

        jest.spyOn(nftRepository(), "findTransactionsByAsset").mockResolvedValue([]);

        demand = buildCertifiedDemand(tokenId, properties, passphrase);

        builder = new UNSCertifiedNftMintBuilder("unik", tokenId)
            .properties(properties)
            .demand(demand.demand)
            .certification(demand.certification, Fixtures.issuerAddress)
            .nonce("1")
            .sign(passphrase);
    });

    describe("throwIfCannotBeApplied", () => {
        beforeEach(() => {
            jest.spyOn(transactionHelpers, "getUnikOwnerAddress").mockResolvedValueOnce(forgeFactoryWallet.address);
        });

        it("should not throw with voucher", async () => {
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).toResolve();
        });

        it("should throw VoucherAlreadyUsedError", async () => {
            jest.spyOn(nftRepository(), "findTransactionsByAsset").mockResolvedValueOnce([
                ("foundTransaction" as any) as Interfaces.ITransactionData,
            ]);

            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                unsErrors.VoucherAlreadyUsedError,
            );
        });

        it("should throw WrongFeeError", async () => {
            builder = new UNSCertifiedNftMintBuilder("unik", tokenId)
                .properties(properties)
                .demand(demand.demand)
                .certification(demand.certification, Fixtures.issuerAddress)
                .nonce("1")
                .fee("500")
                .sign(passphrase);

            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                unsErrors.WrongFeeError,
            );
        });
    });

    describe("custom methods", () => {
        it("should get voucher rewards", async () => {
            expect(getMintVoucherRewards(builder.build().data.asset)).toEqual(
                Managers.configManager.getMilestone().voucherRewards.individual,
            );
        });

        it("checkEmptyBalance", async () => {
            expect(await handler.checkEmptyBalance(builder.build())).toBeFalse();
        });
    });

    describe("apply/revert", () => {
        beforeEach(() => {
            const foundationPubKey = Managers.configManager.get("network.foundation.publicKey");
            const foundationAddress = Identities.Address.fromPublicKey(foundationPubKey);
            foundationWallet = new Wallets.Wallet(foundationAddress);
            walletManager.reindex(foundationWallet);
        });

        describe("apply", () => {
            it("should apply voucher token eco", async () => {
                jest.spyOn(transactionHelpers, "getUnikOwnerAddress").mockResolvedValueOnce(forgeFactoryWallet.address);

                const transaction = builder.build();
                await expect(handler.apply(transaction, walletManager)).toResolve();
                const rewards = getMintVoucherRewards(transaction.data.asset);
                expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.make(rewards.foundation));
                expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.make(rewards.sender));
            });
        });

        describe("revert", () => {
            it("should revert voucher token eco", async () => {
                const transaction = builder.build();
                const rewards = getMintVoucherRewards(transaction.data.asset);

                senderWallet.nonce = Utils.BigNumber.make(1);
                senderWallet.balance = Utils.BigNumber.make(rewards.sender);
                senderWallet.setAttribute("tokens", { [tokenId]: { type: 1 } });
                walletManager.reindex(senderWallet);

                foundationWallet.balance = Utils.BigNumber.make(rewards.foundation);
                walletManager.reindex(foundationWallet);

                await expect(handler.revert(transaction, walletManager)).toResolve();
                expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
                expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            });
        });
    });
});
