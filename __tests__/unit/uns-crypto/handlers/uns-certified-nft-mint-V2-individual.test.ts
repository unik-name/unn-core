/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Identities, Utils } from "@arkecosystem/crypto";
import { CertifiedNftMintTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { NftOwnedError, nftRepository } from "@uns/core-nft";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { DIDTypes } from "@uns/crypto";
import { coreNft } from "../mocks/core-nft";

let handler;
let senderWallet: State.IWallet;
let forgeFactoryWallet: State.IWallet;
let walletManager: State.IWalletManager;
let transaction;
let tokenId;
const didType = DIDTypes.INDIVIDUAL;

describe("CertifiedNtfMint Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    const height = Managers.configManager.getMilestones().find(milestone => !!milestone.unsTokenEcoV2).height;
    Managers.configManager.setHeight(height);

    Handlers.Registry.registerTransactionHandler(CertifiedNftMintTransactionHandler);

    beforeEach(() => {
        handler = new CertifiedNftMintTransactionHandler();
        walletManager = new Wallets.WalletManager();

        tokenId = generateNftId();
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
        const fee = 0;
        transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            fee,
        ).build()[0];

        // Allow Fixtures.tokenId to forge unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.issUnikId]);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            coreNft.exists.mockResolvedValueOnce(false);
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).toResolve();
        });

        it("throw if Unik already in db", async () => {
            coreNft.exists.mockResolvedValueOnce(true);
            await expect(handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)).rejects.toThrow(
                NftOwnedError,
            );
        });
    });

    describe("custom methods", () => {
        it("checkEmptyBalance", async () => {
            expect(await handler.checkEmptyBalance(transaction)).toBeFalse();
        });
    });

    describe("apply", () => {
        it("should apply", async () => {
            await expect(handler.apply(transaction, walletManager, true)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(coreNft.insert).toHaveBeenCalledWith(tokenId, senderWallet.address);
        });
    });

    describe("revert", () => {
        it("should revert service cost", async () => {
            senderWallet.nonce = Utils.BigNumber.make(1);
            senderWallet.setAttribute("tokens", { [Fixtures.nftMintDemand.payload.sub]: { type: didType } });
            walletManager.reindex(senderWallet);

            await expect(handler.revert(transaction, walletManager, true)).toResolve();
            expect(forgeFactoryWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
            expect(coreNft.delete).toHaveBeenCalledWith(tokenId);
        });
    });
});
