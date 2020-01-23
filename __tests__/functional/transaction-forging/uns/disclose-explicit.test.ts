import { EXPLICIT_PROP_KEY } from "@uns/uns-transactions/src/handlers/utils/helpers";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

beforeAll(NftSupport.setUp);
afterAll(support.tearDown);

describe("disclose transaction Nft ", () => {
    let discloseDemand;
    let tokenId;

    beforeAll(async () => {
        await UnsSupport.setupForgeFactory();
    });

    beforeEach(async () => {
        tokenId = NftSupport.generateNftId();
        await NftSupport.mintAndWait(tokenId);
        discloseDemand = await UnsSupport.discloseDemand(tokenId, NftSupport.defaultPassphrase, [
            "explicitValue1",
            "explicitValue2",
        ]);
    });

    it("disclose explicit values", async () => {
        const disclose = await UnsSupport.discloseAndWait(discloseDemand);
        await expect(disclose.id).toBeForged();
        await expect({
            tokenId,
            properties: { [EXPLICIT_PROP_KEY]: discloseDemand["disclose-demand"].payload.explicitValue.join(",") },
        }).toMatchProperties();
    });

    it("update with new disclosed value", async () => {
        let disclose = await UnsSupport.discloseAndWait(discloseDemand);
        await expect(disclose.id).toBeForged();

        const newDiscloseDemand = await UnsSupport.discloseDemand(tokenId, NftSupport.defaultPassphrase, [
            "explicitValue3",
        ]);

        disclose = await UnsSupport.discloseAndWait(newDiscloseDemand);
        await expect(disclose.id).toBeForged();

        const expectedValues = ["explicitValue3"].concat(discloseDemand["disclose-demand"].payload.explicitValue);
        await expect({
            tokenId,
            properties: { [EXPLICIT_PROP_KEY]: expectedValues.join(",") },
        }).toMatchProperties();
    });

    it("change order of disclosed values", async () => {
        let disclose = await UnsSupport.discloseAndWait(discloseDemand);
        await expect(disclose.id).toBeForged();

        const newDiscloseDemand = await UnsSupport.discloseDemand(tokenId, NftSupport.defaultPassphrase, [
            "explicitValue2",
        ]);

        disclose = await UnsSupport.discloseAndWait(newDiscloseDemand);
        await expect(disclose.id).toBeForged();

        const expectedValues = ["explicitValue2", "explicitValue1"];
        await expect({
            tokenId,
            properties: { [EXPLICIT_PROP_KEY]: expectedValues.join(",") },
        }).toMatchProperties();
    });
});
