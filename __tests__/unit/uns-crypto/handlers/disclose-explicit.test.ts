/* tslint:disable:ordered-imports*/
import "jest-extended";
import "../mocks/core-container";
import { Utils, Identities, Managers } from "@arkecosystem/crypto";
import { DiscloseExplicitTransactionHandler, Errors } from "@uns/uns-transactions";
import { IDiscloseDemandPayload, DIDTypes, UNSDiscloseExplicitBuilder } from "@uns/crypto";
import { buildDiscloseDemand } from "../helpers";
import { State } from "@arkecosystem/core-interfaces";
import * as Fixtures from "../__fixtures__";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { IWallet } from "@arkecosystem/core-interfaces/dist/core-state";
import { INftAsset } from "@uns/core-nft-crypto/dist/interfaces";
import { nftRepository } from "@uns/core-nft";

let transaction;
let handler: DiscloseExplicitTransactionHandler;
let builder: UNSDiscloseExplicitBuilder;
let senderWallet: Wallets.Wallet;
let walletManager: State.IWalletManager;

describe("UnsDiscloseExplicit Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(DiscloseExplicitTransactionHandler);

    const DEMANDER_PASSPHRASE = "owner passphrase";
    const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
    const ISS_PASSPHRASE = "iss passphrase";
    const ISS_UNIK_ID = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";

    beforeEach(async () => {
        /* Build Disclose demand */
        const discloseDemandPayload: IDiscloseDemandPayload = {
            explicitValue: ["explicitValue", "anotherExplicitvalue"],
            sub: TOKEN_ID,
            type: DIDTypes.INDIVIDUAL,
            iss: TOKEN_ID,
            iat: Date.now(),
        };
        const discloseDemand = buildDiscloseDemand(
            discloseDemandPayload,
            DEMANDER_PASSPHRASE,
            ISS_UNIK_ID,
            ISS_PASSPHRASE,
        );

        const demanderPubKey = Identities.PublicKey.fromPassphrase(DEMANDER_PASSPHRASE);
        const demanderAddress = Identities.Address.fromPublicKey(demanderPubKey);
        const issuerPubKey = Identities.PublicKey.fromPassphrase(ISS_PASSPHRASE);
        const issuerAddress = Identities.Address.fromPublicKey(issuerPubKey);

        /* Init builder & handler */
        builder = new UNSDiscloseExplicitBuilder();
        handler = new DiscloseExplicitTransactionHandler();

        /* Init walletManager */
        walletManager = new Wallets.WalletManager();
        senderWallet = new Wallets.Wallet(demanderAddress);
        senderWallet.balance = Utils.BigNumber.make("5000000000");
        senderWallet.publicKey = demanderPubKey;
        senderWallet.setAttribute("tokens", { tokens: [TOKEN_ID] });
        walletManager.reindex(senderWallet);

        /* Build transaction */
        transaction = builder
            .discloseDemand(discloseDemand["disclose-demand"], discloseDemand["disclose-demand-certification"])
            .nonce("1")
            .sign(DEMANDER_PASSPHRASE);

        jest.spyOn(walletManager, "findByAddress").mockImplementation((ownerId: string) => {
            switch (ownerId) {
                case issuerAddress:
                    return { publicKey: issuerPubKey } as IWallet;
                case demanderAddress:
                    return { publicKey: demanderPubKey } as IWallet;
                default:
                    return undefined;
            }
        });

        jest.spyOn(nftRepository(), "findById").mockImplementation(
            (tokenId): Promise<INftAsset> => {
                let ownerId;
                switch (tokenId) {
                    case ISS_UNIK_ID:
                        ownerId = issuerAddress;
                        break;
                    case TOKEN_ID:
                        ownerId = demanderAddress;
                        break;
                    default:
                        return undefined;
                }
                return Promise.resolve({ tokenId, ownerId });
            },
        );
        // Allow ISS_UNIK_ID to forge unikname
        Managers.configManager.set("network.forgeFactory.unikidWhiteList", [ISS_UNIK_ID]);
    });

    describe("throwIfCannotBeApplied", () => {
        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager)).toResolve();
        });

        it("should throw DiscloseDemandCertificationSignatureError", async () => {
            transaction.data.asset["disclose-demand-certification"].payload.iat = 666666;
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(Errors.DiscloseDemandCertificationSignatureError);
        });

        it("should throw DiscloseDemandSignatureError", async () => {
            transaction.data.asset["disclose-demand"].payload.iat = 7777777;
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(Errors.DiscloseDemandSignatureError);
        });

        it("should throw DiscloseDemandSubInvalidError (post certification payload replacement)", async () => {
            const counterfeitDiscloseDemand = {
                explicitValue: ["modifiedExplicitValue"],
                sub: TOKEN_ID,
                type: DIDTypes.INDIVIDUAL,
                iss: TOKEN_ID,
                iat: 1234567866,
            };
            transaction.data.asset["disclose-demand"] = buildDiscloseDemand(
                counterfeitDiscloseDemand,
                DEMANDER_PASSPHRASE,
                ISS_UNIK_ID,
                ISS_PASSPHRASE,
            )["disclose-demand"];
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(Errors.DiscloseDemandSubInvalidError);
        });

        it("should throw CertifiedDemandNotAllowedIssuerError", async () => {
            Managers.configManager.set("network.forgeFactory.unikidWhiteList", []);
            await expect(
                handler.throwIfCannotBeApplied(transaction.build(), senderWallet, walletManager),
            ).rejects.toThrow(Errors.CertifiedDemandNotAllowedIssuerError);
        });
    });

    describe("applyToSender", () => {
        it("should not fail", async () => {
            await expect(handler.applyToSender(transaction.build(), walletManager)).toResolve();
        });
    });

    describe("revertForSender", () => {
        it("should not fail", async () => {
            transaction.nonce("0");
            await expect(handler.revertForSender(transaction.build(), walletManager)).toResolve();
        });
    });
});
