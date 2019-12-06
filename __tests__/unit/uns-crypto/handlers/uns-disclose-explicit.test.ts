import "jest-extended";
import { nftsFindByIdMock, nftsFindPropertyByKeyMock } from "../../core-nft/mocks/database-manager";
import "../mocks/core-container";

import { Wallets } from "@arkecosystem/core-state";
import { Handlers } from "@arkecosystem/core-transactions";
import { Managers } from "@arkecosystem/crypto";
import { UNSDiscloseExplicitBuilder } from "@uns/crypto"
import { NftMintTransactionHandler } from "../../../../packages/core-nft/src/transactions"
import { DiscloseExplicitTransactionHandler } from "../../../../packages/uns-transactions/src"
import { DiscloseDemandCertificationSignatureError, DiscloseDemandSignatureError } from "../../../../packages/uns-transactions/src/errors"
import * as Fixtures from "../__fixtures__";


describe("Disclose explicit handler",()=>{

    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);
    Handlers.Registry.registerTransactionHandler(DiscloseExplicitTransactionHandler);

    let handler: DiscloseExplicitTransactionHandler;
    let builder: UNSDiscloseExplicitBuilder;
    let walletManager: Wallets.WalletManager;
    let senderWallet: Wallets.Wallet;

    beforeAll( ()=>{
        nftsFindPropertyByKeyMock.mockImplementation( key => {
            switch (key) {
                case "immutableProp":
                    return 1;
                default:
                    return true;
            }
        })

        nftsFindByIdMock.mockImplementation( id => {
            let nftId;
            let ownerId;
            switch (id) {
                case "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051":
                    nftId = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
                    ownerId = "DEbyWA3XZHkdVv8ZMPkV7Qzqs7k5iJoPFZ";
                    break;
                case "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f":
                    nftId = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
                    ownerId = "DNr6xHfWySFN5eGqaxrwydAnN4ejvgDsEA";
                    break;
                default:
                    return null;
            }
            return Promise.resolve({ id: nftId, ownerId });
        })
    })

    beforeEach(() => {
        handler = new DiscloseExplicitTransactionHandler();
        builder = new UNSDiscloseExplicitBuilder();
        walletManager = new Wallets.WalletManager();
        senderWallet = Fixtures.wallet();
        walletManager.reindex(senderWallet);
    });

    describe("can be applied", () => {

        it("should pass", async () => {

            const transaction = Fixtures.discloseExplicitTransaction().build();
            await expect(
                handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)
            ).resolves.toBeUndefined()
        });

        it("should throw DiscloseDemandCertificationSignatureError", async () => {
            
            const fakeCertification = Fixtures.discloseDemand["disclose-demand-certification"];
            fakeCertification.payload.iat = 666666

            const transaction = builder
                .discloseDemand(
                    Fixtures.discloseDemand["disclose-demand"], 
                    fakeCertification)
                .sign(Fixtures.ownerPassphrase)
                .build();


             await expect(
                handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)
            ).rejects.toThrowError(DiscloseDemandCertificationSignatureError)
        });

        it("should throw DiscloseDemandSignatureError", async () => {

            const fakeDemand = Fixtures.discloseDemand["disclose-demand"];
            fakeDemand.payload.iat = 7777777

            const transaction = builder
                .discloseDemand(
                    fakeDemand,
                    Fixtures.discloseDemand["disclose-demand-certification"]
                )
                .sign(Fixtures.ownerPassphrase)
                .build();


             await expect(
                handler.throwIfCannotBeApplied(transaction, senderWallet, walletManager)
            ).rejects.toThrowError(DiscloseDemandSignatureError)
        });

    })

})