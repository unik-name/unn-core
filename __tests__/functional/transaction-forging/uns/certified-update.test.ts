import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import * as Fixtures from "../../../unit/uns-crypto/__fixtures__";
import { buildCertifiedDemand } from "../../../unit/uns-crypto/helpers";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

let walletManager: IWalletManager;
beforeAll(async () => {
    Managers.configManager.set("network.forgeFactory.unikidWhiteList", [UnsSupport.forgerFactoryTokenId]);
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
    walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;
});
afterAll(support.tearDown);

describe("Uns certified update", () => {
    it("mint nft and verify url", async () => {
        const tokenId = "deadbeefdd4fd00ba513e1ca09abb8522a8ba94fa2a7a81dd674eac27ce66b94";
        const senderPassphrase = "the sender passphrase";
        const senderAddress = Identities.Address.fromPassphrase(senderPassphrase);
        const senderWallet = walletManager.findByAddress(senderAddress);

        await NftSupport.transferAndWait(senderAddress, 33);
        const senderInitBalance = senderWallet.balance;

        const properties = {
            type: "1",
        };

        const forgeFactoryAddress = Identities.Address.fromPassphrase(UnsSupport.forgerFactoryPassphrase);
        const forgeFactoryWallet = walletManager.findByAddress(forgeFactoryAddress);
        const forgeFactoryInitialBalance = forgeFactoryWallet.balance;

        const mintCost = Utils.BigNumber.make("666");
        const demand = buildCertifiedDemand(
            tokenId,
            properties,
            senderPassphrase,
            mintCost,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
        );
        const mintTx = await UnsSupport.certifiedMintAndWait(tokenId, properties, demand, senderPassphrase);
        await expect(mintTx.id).toBeForged();
        await expect({ tokenId, properties }).toMatchProperties();

        const builder = Fixtures.buildUrlCheckerTransaction(
            {
                tokenId: UnsSupport.forgerFactoryTokenId,
                address: forgeFactoryAddress,
                passphrase: UnsSupport.forgerFactoryPassphrase,
            },
            { tokenId, address: senderAddress, passphrase: senderPassphrase },
        );

        const updateTx = await UnsSupport.certifiedUpdateAndWait(builder, senderPassphrase);
        await expect(updateTx.id).toBeForged();

        expect(forgeFactoryWallet.balance).toEqual(
            forgeFactoryInitialBalance.plus(mintTx.amount).plus(updateTx.amount),
        );
        expect(senderWallet.balance).toEqual(
            senderInitBalance
                .minus(mintCost)
                .minus(mintTx.fee)
                .minus(updateTx.amount)
                .minus(updateTx.fee),
        );
    });
});
