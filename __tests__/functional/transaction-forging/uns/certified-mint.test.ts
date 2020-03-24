import { Managers, Utils } from "@arkecosystem/crypto";
import { buildCertifiedDemand } from "../../../unit/uns-crypto/helpers";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

beforeAll(async () => {
    Managers.configManager.set("network.forgeFactory.unikidWhiteList", [UnsSupport.forgerFactoryTokenId]);
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
});
afterAll(support.tearDown);

describe("Uns certified mint", () => {
    it("nft certified mint", async () => {
        const tokenId = "deadbeefdd4fd00ba513e1ca09abb8522a8ba94fa2a7a81dd674eac27ce66b94";
        const properties = {
            type: "1",
        };

        const demand = buildCertifiedDemand(
            tokenId,
            properties,
            NftSupport.defaultPassphrase,
            Utils.BigNumber.make("666"),
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
        );
        const trx = await UnsSupport.certifiedMintAndWait(tokenId, properties, demand);
        await expect(trx.id).toBeForged();
        await expect({ tokenId, properties }).toMatchProperties();
    });

    it("nft certified mint with voucher", async () => {
        const tokenId = "deadbabedd4fd00ba513e1ca09abb8522a8ba94fa2a7a81dd674eac27ce66b94";
        const voucherId = "6trg50ZxgEPl9Av8V67c0";
        const properties = {
            type: "1",
            UnikVoucherId: voucherId,
        };
        const passphrase = "user passphrase";
        const demand = buildCertifiedDemand(
            tokenId,
            properties,
            passphrase,
            Utils.BigNumber.ZERO,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
        );
        const trx = await UnsSupport.certifiedMintAndWait(tokenId, properties, demand, passphrase);
        await expect(trx.id).toBeForged();
        await expect({ tokenId, properties }).toMatchProperties();
    });
});
