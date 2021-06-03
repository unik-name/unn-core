/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { CertifiedNftUpdateTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades, getRewardsFromDidType, DIDTypes, IUnsRewards } from "@uns/crypto";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import * as transactionHelpers from "@uns/uns-transactions/dist/handlers/utils";

let handler;
let transaction;
let senderWallet: State.IWallet;
let forgeFactoryWallet: Wallets.Wallet;
let foundationWallet: State.IWallet;
let walletManager: State.IWalletManager;
let rewards: IUnsRewards;
let tokenId;
const serviceCost = Utils.BigNumber.ZERO;
const didType = DIDTypes.INDIVIDUAL;

describe("CertifiedNtfUpdate Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    const height = Managers.configManager.getMilestones().find(milestone => !!milestone.unsTokenEcoV2).height;
    Managers.configManager.setHeight(height);

    Handlers.Registry.registerTransactionHandler(CertifiedNftUpdateTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftUpdateTransactionHandler();
        walletManager = new Wallets.WalletManager();
        tokenId = generateNftId();
        const senderPassphrase = "sender passphrase";
        senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        senderWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
        walletManager.reindex(senderWallet);

        const issuerPubKey = Fixtures.issKeys.publicKey;
        forgeFactoryWallet = new Wallets.Wallet(Fixtures.issuerAddress);
        forgeFactoryWallet.publicKey = issuerPubKey;
        walletManager.reindex(forgeFactoryWallet);

        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };

        rewards = getRewardsFromDidType(didType);
        transaction = NFTTransactionFactory.nftCertifiedUpdate(
            tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            rewards.forger,
        ).build()[0];

        // Allow Fixtures.tokenId to update unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);

        const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
        foundationWallet = walletManager.findByAddress(Identities.Address.fromPublicKey(foundationPublicKey));
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw for alive demand", async () => {
            jest.spyOn(transactionHelpers, "getUnikOwnerAddress").mockResolvedValueOnce(forgeFactoryWallet.address);
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });
    });

    describe("apply", () => {
        it("should apply service costs", async () => {
            jest.spyOn(transactionHelpers, "getUnikOwnerAddress").mockResolvedValueOnce(forgeFactoryWallet.address);
            await expect(handler.apply(transaction, walletManager)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(transaction.data.amount);
            expect(senderWallet.balance.toString()).toEqual(rewards.sender.toString());
            expect(foundationWallet.balance).toStrictEqual(
                Utils.BigNumber.make(rewards.foundation).minus(transaction.data.amount),
            );

            expect(forgeFactoryWallet.balance.plus(senderWallet.balance).plus(foundationWallet.balance)).toStrictEqual(
                Utils.BigNumber.make(rewards.sender + rewards.foundation),
            );
        });
    });

    describe("revert", () => {
        it("should revert service cost", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);
            senderWallet.balance = Utils.BigNumber.make(rewards.sender);
            walletManager.reindex(senderWallet);
            foundationWallet.balance = Utils.BigNumber.make(rewards.foundation).minus(transaction.data.amount);
            walletManager.reindex(foundationWallet);

            await expect(handler.revert(transaction, walletManager)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
        });
    });

    describe("custom methods", () => {
        it("checkEmptyBalance", () => {
            expect(handler.checkEmptyBalance(transaction, senderWallet)).toBeFalse();
        });
    });
});
