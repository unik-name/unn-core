/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import "jest-extended";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { Wallet, WalletManager } from "@arkecosystem/core-state/src/wallets";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades, DIDTypes, getRewardsFromDidType } from "@uns/crypto";
import { Handlers } from "@arkecosystem/core-transactions";
import { CertifiedNftUpdateTransactionHandler } from "@uns/uns-transactions";
import * as transactionHelpers from "@uns/uns-transactions/dist/handlers/utils";
import { State } from "@arkecosystem/core-interfaces";
import { nftRepository } from "@uns/core-nft";

let walletManager: State.IWalletManager;

describe("Models - Wallet", () => {
    Managers.configManager.setFromPreset("dalinet");
    const height = Managers.configManager.getMilestones().find(milestone => !!milestone.unsTokenEcoV2).height;
    Managers.configManager.setHeight(height);
    Handlers.Registry.registerTransactionHandler(CertifiedNftUpdateTransactionHandler);

    let senderWallet: Wallet;
    let tokenId: string;
    let senderPassphrase: string;
    let issuerWallet: Wallet;
    let issuerTokenId: string;
    let issuerPassphrase: string;
    let foundationWallet: State.IWallet;

    beforeEach(() => {
        walletManager = new WalletManager();

        tokenId = generateNftId();
        senderPassphrase = "super secret passphrase" + tokenId.substr(0, 10);
        senderWallet = new Wallet(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        walletManager.reindex(senderWallet);

        issuerTokenId = generateNftId();
        issuerPassphrase = "issuer super secret passphrase" + issuerTokenId.substr(0, 10);
        issuerWallet = new Wallet(Identities.Address.fromPassphrase(issuerPassphrase));
        issuerWallet.publicKey = Identities.PublicKey.fromPassphrase(issuerPassphrase);
        walletManager.reindex(issuerWallet);

        const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
        foundationWallet = walletManager.findByAddress(Identities.Address.fromPublicKey(foundationPublicKey));

        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [issuerTokenId]);

        jest.spyOn(transactionHelpers, "getUnikOwnerAddress").mockResolvedValueOnce(issuerWallet.address);
    });

    it("should apply certified mint transaction for individual", async () => {
        const serviceCost = Utils.BigNumber.make(123456789);
        const didType = DIDTypes.INDIVIDUAL;
        const properties = {
            type: didType.toString(),
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
        };

        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            senderPassphrase,
            issuerTokenId,
            issuerPassphrase,
            properties,
            serviceCost,
        )
            .withNetwork("dalinet")
            .withPassphrase(senderPassphrase)
            .build()[0];

        // provide suficient founds to sender wallet
        senderWallet.balance = transaction.data.fee.plus(serviceCost);
        walletManager.reindex(senderWallet);

        await walletManager.applyTransaction(transaction);

        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);
        expect(senderWallet.getAttribute("tokens")).toEqual({ [tokenId]: { type: didType } });
        expect(issuerWallet.balance).toEqual(serviceCost);
    });

    it("should apply voucher certified mint transaction for individual (zero fee)", async () => {
        const serviceCost = Utils.BigNumber.ZERO;
        const didType = DIDTypes.INDIVIDUAL;
        const properties = {
            type: didType.toString(),
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
            UnikVoucherId: "37_8NSbxgbBatKU-MqX4H",
        };

        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            senderPassphrase,
            issuerTokenId,
            issuerPassphrase,
            properties,
            serviceCost,
        )
            .withFee(0)
            .withNetwork("dalinet")
            .withPassphrase(senderPassphrase)
            .build()[0];

        await walletManager.applyTransaction(transaction);

        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);
        expect(senderWallet.getAttribute("tokens")).toEqual({ [tokenId]: { type: didType } });

        expect(issuerWallet.balance).toEqual(Utils.BigNumber.ZERO);
    });

    it("should apply voucher certified mint transaction for organization)", async () => {
        const serviceCost = Utils.BigNumber.ZERO;
        const didType = DIDTypes.ORGANIZATION;
        const properties = {
            type: didType.toString(),
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
            UnikVoucherId: "37_8NSbxgbBatKU-MqX4H",
        };

        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            senderPassphrase,
            issuerTokenId,
            issuerPassphrase,
            properties,
            serviceCost,
        )
            .withNetwork("dalinet")
            .withPassphrase(senderPassphrase)
            .build()[0];

        await walletManager.applyTransaction(transaction);

        const rewards = getRewardsFromDidType(didType);

        expect(+senderWallet.balance).toEqual(rewards.sender);
        expect(senderWallet.getAttribute("tokens")).toEqual({ [tokenId]: { type: didType } });

        expect(issuerWallet.balance).toEqual(Utils.BigNumber.ZERO);
        expect(+foundationWallet.balance).toEqual(rewards.foundation);
    });

    it("should apply certified update transaction", async () => {
        const serviceCost = Utils.BigNumber.make(654321);
        const properties = {
            myProperty: "OhMyProperty",
        };

        const transaction = NFTTransactionFactory.nftCertifiedUpdate(
            tokenId,
            senderPassphrase,
            issuerTokenId,
            issuerPassphrase,
            properties,
            serviceCost,
        )
            .withNetwork("dalinet")
            .withPassphrase(senderPassphrase)
            .build()[0];

        senderWallet.setAttribute("tokens", { [tokenId]: { type: 999 } });
        senderWallet.balance = transaction.data.fee.plus(serviceCost);
        walletManager.reindex(senderWallet);

        await walletManager.applyTransaction(transaction);

        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);
        expect(issuerWallet.balance).toEqual(serviceCost);
    });

    it("should apply alive demand for individual", async () => {
        const serviceCost = Utils.BigNumber.ZERO;
        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };
        const didType = DIDTypes.INDIVIDUAL;
        const rewards = getRewardsFromDidType(didType);

        const transaction = NFTTransactionFactory.nftCertifiedUpdate(
            tokenId,
            senderPassphrase,
            issuerTokenId,
            issuerPassphrase,
            properties,
            serviceCost,
        )
            .withFee(rewards.forger)
            .withNetwork("dalinet")
            .withPassphrase(senderPassphrase)
            .build()[0];

        jest.spyOn(nftRepository(), "findProperties").mockResolvedValueOnce([
            {
                key: "type",
                value: didType.toString(),
            },
            {
                key: LIFE_CYCLE_PROPERTY_KEY,
                value: LifeCycleGrades.ISSUED.toString(),
            },
        ]);
        senderWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
        walletManager.reindex(senderWallet);

        await walletManager.applyTransaction(transaction);

        expect(+senderWallet.balance).toEqual(rewards.sender);
        expect(issuerWallet.balance).toEqual(serviceCost);
        expect(+foundationWallet.balance).toEqual(rewards.foundation);
    });

    it("should apply alive demand for orgnanization", async () => {
        const serviceCost = Utils.BigNumber.make(789456);
        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };
        const didType = DIDTypes.ORGANIZATION;

        const transaction = NFTTransactionFactory.nftCertifiedUpdate(
            tokenId,
            senderPassphrase,
            issuerTokenId,
            issuerPassphrase,
            properties,
            serviceCost,
        )
            .withNetwork("dalinet")
            .withPassphrase(senderPassphrase)
            .build()[0];

        jest.spyOn(nftRepository(), "findProperties").mockResolvedValueOnce([
            {
                key: "type",
                value: didType.toString(),
            },
            {
                key: LIFE_CYCLE_PROPERTY_KEY,
                value: LifeCycleGrades.ISSUED.toString(),
            },
        ]);
        senderWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
        senderWallet.balance = serviceCost.plus(transaction.data.fee);
        walletManager.reindex(senderWallet);

        await walletManager.applyTransaction(transaction);

        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);
        expect(issuerWallet.balance).toEqual(serviceCost);
    });
});
