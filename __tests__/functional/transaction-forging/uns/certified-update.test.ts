import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Utils } from "@arkecosystem/crypto";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

let walletManager: IWalletManager;
beforeAll(async () => {
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
    walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;
});
afterAll(async () => support.tearDown());

describe("Uns certified update", () => {
    it("mint nft and verify url", async () => {
        const tokenId = NftSupport.generateNftId();
        const senderPassphrase = "my passphrase " + tokenId.substr(0, 10);
        const senderAddress = Identities.Address.fromPassphrase(senderPassphrase);
        const senderWallet = walletManager.findByAddress(senderAddress);

        await NftSupport.transferAndWait(senderAddress, 33);
        const senderInitBalance = senderWallet.balance;

        const mintProperties = {
            type: "1",
        };

        const forgeFactoryAddress = Identities.Address.fromPassphrase(UnsSupport.forgerFactoryPassphrase);
        const forgeFactoryWallet = walletManager.findByAddress(forgeFactoryAddress);
        const forgeFactoryInitialBalance = forgeFactoryWallet.balance;

        const mintCost = Utils.BigNumber.make("123666");
        const mintFee = 10000000;

        const mintTx = await UnsSupport.certifiedMintAndWait(
            tokenId,
            senderPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            mintProperties,
            mintCost,
            mintFee,
        );

        await expect(mintTx.id).toBeForged();
        await expect({ tokenId, properties: mintProperties }).toMatchProperties();

        const properties = {
            "Verified/URL/MyUrl": "https://www.toto.lol",
            "Verified/URL/MyUrl/proof":
                '{"iat":1598434813,"exp":1598694013,"jti":"SyjfEteA8tSAPRjV4b_lw","sig":"jwtSignature"}',
        };

        const serviceCost = Utils.BigNumber.make(100000000);
        const updateFee = 100000000;

        const updateTx = await UnsSupport.certifiedUpdateAndWait(
            tokenId,
            senderPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            properties,
            serviceCost,
            updateFee,
        );

        await expect(updateTx.id).toBeForged();

        await expect({ tokenId, properties: { ...mintProperties, ...properties } }).toMatchProperties();

        expect(forgeFactoryWallet.balance).toEqual(
            forgeFactoryInitialBalance.plus(mintTx.amount).plus(updateTx.amount),
        );
        expect(senderWallet.balance).toEqual(
            senderInitBalance
                .minus(mintCost)
                .minus(mintFee)
                .minus(serviceCost)
                .minus(updateFee),
        );
    });
});
