/* tslint:disable:ordered-imports*/
import "../mocks/core-container";
import "jest-extended";
import { State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Identities } from "@arkecosystem/crypto";
import {
    INftMintDemand,
    NftMintDemandCertificationSigner,
    NftMintDemandPayloadHashBuffer,
    UNSCertifiedNftMintBuilder,
} from "@uns/crypto";
import { CertifiedNftMintTransactionHandler, Errors } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { IWallet } from "@arkecosystem/core-interfaces/dist/core-state";
import { INftAsset } from "@uns/core-nft-crypto/dist/interfaces";
import { nftRepository } from "@uns/core-nft";

let handler;
let builder: UNSCertifiedNftMintBuilder;
let senderWallet: Wallets.Wallet;
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

        const issuerPubKey = Identities.PublicKey.fromPassphrase(Fixtures.ownerPassphrase);
        const issuerAddress = Identities.Address.fromPublicKey(issuerPubKey);

        builder = new UNSCertifiedNftMintBuilder("unik", Fixtures.nftMintDemandCertificationPayload.sub);

        const expectedSub = new NftMintDemandPayloadHashBuffer(
            builder.getCurrentAsset() as INftMintDemand,
        ).getPayloadHashBuffer();

        const payload = Fixtures.nftMintDemandCertificationPayload;
        // Update the calculated sub
        payload.sub = expectedSub;

        const signer = new NftMintDemandCertificationSigner(payload);
        const signature = signer.sign(Fixtures.ownerPassphrase);

        builder
            .certification({ payload, signature })
            .nonce("1")
            .sign(Fixtures.ownerPassphrase);

        jest.spyOn(walletManager, "findByAddress").mockImplementation((ownerId: string) => {
            switch (ownerId) {
                case issuerAddress:
                    return { publicKey: issuerPubKey } as IWallet;
                default:
                    return undefined;
            }
        });

        jest.spyOn(nftRepository(), "findById").mockImplementation(
            (tokenId): Promise<INftAsset> => {
                let ownerId;
                switch (tokenId) {
                    case Fixtures.nftMintDemandCertificationPayload.iss:
                        ownerId = issuerAddress;
                        break;
                    default:
                        return undefined;
                }
                return Promise.resolve({ tokenId, ownerId });
            },
        );
    });

    describe("throwIfCannotBeApplied", () => {
        beforeAll(() => {
            // Allow Fixtures.tokenId to forge unikname
            Managers.configManager.set("network.forgeFactory.unikidWhiteList", [Fixtures.tokenId]);
        });

        it("should not throw", async () => {
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).toResolve();
        });

        it("should throw NftMintCertificationBadSignatureError payload modification", async () => {
            // Payload hacking attempt
            builder.data.asset.certification.payload.iat = 666666;
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                Errors.NftMintCertificationBadSignatureError,
            );
        });

        it("should throw NftMintCertificationBadPayloadSubjectError asset Nft Demand modification", async () => {
            // Payload hacking attempt
            builder.data.asset.nft.unik.tokenId = Fixtures.tokenId;
            await expect(handler.throwIfCannotBeApplied(builder.build(), senderWallet, walletManager)).rejects.toThrow(
                Errors.NftMintCertificationBadPayloadSubjectError,
            );
        });
    });
});
