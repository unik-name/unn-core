/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Identities, Utils } from "@arkecosystem/crypto";
import { CertifiedNftTransferTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { DIDTypes } from "@uns/crypto";
import * as transactionHelpers from "@uns/uns-transactions/dist/handlers/utils";
import { app } from "@arkecosystem/core-container";

let handler;
let senderWallet: State.IWallet;
let recipientWallet: State.IWallet;
let forgeFactoryWallet: State.IWallet;
let walletManager: State.IWalletManager;
let transaction;
const tokenId = generateNftId();
const didType = DIDTypes.INDIVIDUAL;
const serviceCost = Utils.BigNumber.make("321");
const fee = Utils.BigNumber.make("1000");

describe("CertifiedNtfTransfer Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    const height = Managers.configManager.getMilestones().find(milestone => !!milestone.unsTokenEcoV2).height;
    Managers.configManager.setHeight(height);

    Handlers.Registry.registerTransactionHandler(CertifiedNftTransferTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftTransferTransactionHandler();
        walletManager = new Wallets.WalletManager();

        const passphrase = "the passphrase " + tokenId.substr(0, 10);

        senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(passphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
        senderWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
        senderWallet.balance = serviceCost.plus(fee);
        walletManager.reindex(senderWallet);

        const recipientPassphrase = "recipient passphrase";
        recipientWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(recipientPassphrase));
        recipientWallet.publicKey = Identities.PublicKey.fromPassphrase(recipientPassphrase);
        walletManager.reindex(recipientWallet);

        forgeFactoryWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(Fixtures.issPassphrase));
        forgeFactoryWallet.publicKey = Identities.PublicKey.fromPassphrase(Fixtures.issPassphrase);
        walletManager.reindex(forgeFactoryWallet);

        const properties = {
            newProp: "theNewProperty",
        };

        transaction = NFTTransactionFactory.nftCertifiedTransfer(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            +fee,
            recipientWallet.address,
        ).build()[0];

        // Allow Fixtures.tokenId to forge unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            jest.spyOn(transactionHelpers, "getUnikOwnerAddress")
                .mockResolvedValueOnce(forgeFactoryWallet.address)
                .mockResolvedValueOnce(senderWallet.address);

            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });
    });

    describe("apply", () => {
        it("should apply ", async () => {
            jest.spyOn(transactionHelpers, "getUnikOwnerAddress")
                .mockResolvedValueOnce(forgeFactoryWallet.address)
                .mockResolvedValueOnce(senderWallet.address)
                .mockResolvedValueOnce(forgeFactoryWallet.address);
            app.resolvePlugin("core-nft").getProperty.mockResolvedValueOnce({ value: didType.toString() });

            await expect(handler.apply(transaction, walletManager)).toResolve();

            // check forge factory has bee paid
            expect(forgeFactoryWallet.balance).toStrictEqual(serviceCost);
            // check sender balance & attributes
            expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.hasAttribute("tokens")).toBeFalse();
            // check recipient balance & attributes
            expect(recipientWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(recipientWallet.getAttributes()).toStrictEqual({ tokens: { [tokenId]: { type: didType } } });
        });
    });

    describe("revert", () => {
        it("should revert", async () => {
            app.resolvePlugin("core-nft").getProperty.mockResolvedValueOnce({ value: didType.toString() });

            jest.spyOn(transactionHelpers, "getUnikOwnerAddress").mockResolvedValueOnce(forgeFactoryWallet.address);

            recipientWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
            walletManager.reindex(recipientWallet);

            senderWallet.nonce = Utils.BigNumber.make(1);
            senderWallet.balance = Utils.BigNumber.ZERO;
            senderWallet.forgetAttribute("tokens");
            walletManager.reindex(senderWallet);

            forgeFactoryWallet.balance = serviceCost;
            walletManager.reindex(forgeFactoryWallet);

            await expect(handler.revert(transaction, walletManager)).toResolve();

            expect(forgeFactoryWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(recipientWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(recipientWallet.hasAttribute("tokens")).toBeFalse();
            expect(senderWallet.balance).toStrictEqual(serviceCost.plus(fee));
            expect(senderWallet.getAttributes()).toStrictEqual({ tokens: { [tokenId]: { type: didType } } });
        });
    });
});
