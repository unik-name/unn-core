/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import "jest-extended";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { Wallet, WalletManager } from "@arkecosystem/core-state/src/wallets";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades, DIDTypes } from "@uns/crypto";
import { Handlers } from "@arkecosystem/core-transactions";
import { CertifiedNftUpdateTransactionHandler } from "@uns/uns-transactions";
import { State } from "@arkecosystem/core-interfaces";
import { nftRepository } from "@uns/core-nft";
import { coreNft } from "../mocks/core-nft";

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

        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [issuerTokenId]);

        jest.spyOn(nftRepository(), "findById").mockResolvedValueOnce({
            tokenId: issuerTokenId,
            ownerId: issuerWallet.address,
        });
    });

    it("should revert certified mint transaction for individual", async () => {
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

        // Initial state before revert
        senderWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
        senderWallet.nonce = Utils.BigNumber.make(1);
        issuerWallet.balance = serviceCost;

        await walletManager.revertTransaction(transaction);

        expect(senderWallet.balance).toEqual(transaction.data.fee.plus(serviceCost));
        expect(senderWallet.getAttribute("tokens")).toBeUndefined();
        expect(coreNft.delete).toHaveBeenCalledWith(tokenId);
        expect(issuerWallet.balance).toEqual(Utils.BigNumber.ZERO);
    });

    it("should revert voucher certified mint transaction for individual (zero fee)", async () => {
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

        // Initial state before revert
        senderWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
        senderWallet.nonce = Utils.BigNumber.make(1);

        await walletManager.revertTransaction(transaction);

        expect(senderWallet.balance).toEqual(transaction.data.fee.plus(serviceCost));
        expect(senderWallet.getAttribute("tokens")).toBeUndefined();
        expect(coreNft.delete).toHaveBeenCalledWith(tokenId);
        expect(issuerWallet.balance).toEqual(Utils.BigNumber.ZERO);
    });
});
