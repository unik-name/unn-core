/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Identities, Utils } from "@arkecosystem/crypto";
import { CertifiedNftMintTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { nftRepository } from "@uns/core-nft";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { DIDTypes, getRewardsFromDidType, IUnsRewards } from "@uns/crypto";
import { getFoundationWallet } from "@uns/uns-transactions/src/handlers/utils/helpers";

let handler;
let senderWallet: State.IWallet;
let forgeFactoryWallet: State.IWallet;
let walletManager: State.IWalletManager;
let transaction;
const didType = DIDTypes.ORGANIZATION;
let rewards: IUnsRewards;
describe("CertifiedNtfMint Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    const height = Managers.configManager.getMilestones().find(milestone => !!milestone.unsTokenEcoV2).height;
    Managers.configManager.setHeight(height);

    Handlers.Registry.registerTransactionHandler(CertifiedNftMintTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftMintTransactionHandler();
        walletManager = new Wallets.WalletManager();

        const tokenId = generateNftId();
        const passphrase = "the passphrase " + tokenId.substr(0, 10);
        const UnikVoucherId = "my voucher" + tokenId.substr(0, 10);
        senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(passphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
        walletManager.reindex(senderWallet);

        forgeFactoryWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(Fixtures.issPassphrase));
        forgeFactoryWallet.publicKey = Identities.PublicKey.fromPassphrase(Fixtures.issPassphrase);
        walletManager.reindex(forgeFactoryWallet);

        jest.spyOn(nftRepository(), "findById").mockResolvedValue({
            tokenId: Fixtures.issUnikId,
            ownerId: Identities.Address.fromPassphrase(Fixtures.issPassphrase),
        });

        const properties = {
            type: didType.toString(),
            UnikVoucherId,
        };
        const serviceCost = Utils.BigNumber.ZERO;
        rewards = getRewardsFromDidType(didType);
        transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            rewards.forger,
        ).build()[0];

        // Allow Fixtures.tokenId to forge unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });
    });

    describe("custom methods", () => {
        it("checkEmptyBalance", async () => {
            expect(await handler.checkEmptyBalance(transaction)).toBeFalse();
        });
    });

    describe("apply", () => {
        it("should apply ", async () => {
            await expect(handler.apply(transaction, walletManager)).toResolve();
            expect(+forgeFactoryWallet.balance).toStrictEqual(0);
            expect(+senderWallet.balance).toStrictEqual(rewards.sender);
            const foundationWallet = getFoundationWallet(walletManager);
            expect(+foundationWallet.balance).toStrictEqual(rewards.foundation);
        });
    });

    describe("revert", () => {
        it("should revert service cost", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);
            senderWallet.setAttribute("tokens", { [Fixtures.nftMintDemand.payload.sub]: { type: didType } });
            senderWallet.balance = Utils.BigNumber.make(rewards.sender);
            walletManager.reindex(senderWallet);
            const foundationWallet = getFoundationWallet(walletManager);
            foundationWallet.balance = Utils.BigNumber.make(rewards.foundation);
            walletManager.reindex(foundationWallet);

            await expect(handler.revert(transaction, walletManager)).toResolve();
            expect(+forgeFactoryWallet.balance).toStrictEqual(0);
            expect(+senderWallet.balance).toStrictEqual(0);
            expect(+foundationWallet.balance).toStrictEqual(0);
        });
    });
});
