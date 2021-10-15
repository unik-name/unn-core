import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { DIDTypes } from "@uns/crypto";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

let walletManager: IWalletManager;
beforeAll(async () => {
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
    walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

    // force v2 token Eco
    Managers.configManager.getMilestone().unsTokenEcoV2 = true;
});
afterAll(async () => support.tearDown());

describe("Uns certified transfer", () => {
    it("certified transfer without properties", async () => {
        const tokenId = NftSupport.generateNftId();
        const didType = DIDTypes.INDIVIDUAL;

        const properties = { type: didType.toString() };

        const serviceCost = Utils.BigNumber.make(123456789);
        const fee = 100000000;

        const passphrase = "senderzz passphrase";
        const senderAddress = Identities.Address.fromPassphrase(passphrase);
        const senderWallet = walletManager.findByAddress(senderAddress);
        senderWallet.balance = serviceCost.plus(fee);
        walletManager.reindex(senderWallet);

        const recipientPassphrase = "the recipient passphrase";
        const recipientWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(recipientPassphrase));
        recipientWallet.balance = Utils.BigNumber.make(1000000000);
        walletManager.reindex(recipientWallet);

        const factoryWallet = walletManager.findByAddress(
            Identities.Address.fromPassphrase(UnsSupport.forgerFactoryPassphrase),
        );
        const factoryInitialBalance = factoryWallet.balance;

        const mint = await UnsSupport.certifiedMintAndWait(
            tokenId,
            passphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            properties,
            Utils.BigNumber.ZERO,
            0,
        );

        await expect(mint.id).toBeForged();

        const transfer = await UnsSupport.certifiedTransferAndWait(
            tokenId,
            passphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            {},
            serviceCost,
            recipientWallet.address,
            fee,
        );

        await expect(transfer.id).toBeForged();
        expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
        expect(senderWallet.hasAttribute("tokens")).toBeFalse();

        expect(recipientWallet.hasAttribute("tokens")).toBeTrue();
        expect(recipientWallet.getAttributes()).toEqual({ tokens: { [tokenId]: { type: didType } } });

        expect(factoryWallet.balance).toEqual(factoryInitialBalance.plus(serviceCost));

        await expect({ tokenId, properties }).toMatchProperties();

        // Send back unik
        const transfer2 = await UnsSupport.certifiedTransferAndWait(
            tokenId,
            recipientPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            {},
            serviceCost,
            senderWallet.address,
            fee,
        );
        await expect(transfer2.id).toBeForged();

        expect(recipientWallet.hasAttribute("tokens")).toBeFalse();
        expect(senderWallet.hasAttribute("tokens")).toBeTrue();
        expect(senderWallet.getAttributes()).toEqual({ tokens: { [tokenId]: { type: didType } } });
    });
});
