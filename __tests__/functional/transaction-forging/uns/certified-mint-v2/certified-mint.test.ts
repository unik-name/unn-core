import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import * as support from "../../__support__";
import * as NftSupport from "../../__support__/nft";
import * as UnsSupport from "../../__support__/uns";

let walletManager: IWalletManager;
beforeAll(async () => {
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
    walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

    // force v2 token Eco
    Managers.configManager.getMilestone().unsTokenEcoV2 = true;
});
afterAll(async () => support.tearDown());

describe("Uns certified mint", () => {
    it("certified mint paid with UNS", async () => {
        const tokenId = NftSupport.generateNftId();
        const passphrase = "the passphrase " + tokenId.substr(0, 10);

        const properties = {
            type: "1",
        };
        const serviceCost = Utils.BigNumber.make(123456789);
        const fee = 100000000;

        const senderAddress = Identities.Address.fromPassphrase(passphrase);
        const senderWallet = walletManager.findByAddress(senderAddress);
        senderWallet.balance = serviceCost.plus(Utils.BigNumber.make(fee));
        walletManager.reindex(senderWallet);

        const trx = await UnsSupport.certifiedMintAndWait(
            tokenId,
            passphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            properties,
            serviceCost,
            fee,
        );

        await expect(trx.id).toBeForged();
        expect(senderWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);
        await expect({ tokenId, properties }).toMatchProperties();
    });
});
