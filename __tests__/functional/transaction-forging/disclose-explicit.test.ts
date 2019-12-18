import { DIDTypes } from "@uns/crypto";
import { EXPLICIT_PROP_KEY } from "@uns/uns-transactions/src/handlers/utils/helpers";
import delay from "delay";
import { buildDiscloseDemand } from "../../unit/uns-crypto/helpers";
import * as support from "./__support__";
import * as NftSupport from "./__support__/nft";
import { discloseAndWait } from "./__support__/uns";

beforeAll(NftSupport.setUp);
afterAll(support.tearDown);

describe("disclose transaction Nft ", () => {
    let discloseDemand;
    let tokenId;
    let issuerTokenId;
    beforeEach(async () => {
        tokenId = NftSupport.generateNftId();
        // delay to ensure generation of differents token ids
        await delay(2);
        issuerTokenId = NftSupport.generateNftId();

        /* Build Disclose demand */
        const discloseDemandPayload = {
            explicitValue: ["explicitValue1", "explicitValue2"],
            sub: tokenId,
            type: DIDTypes.INDIVIDUAL,
            iss: tokenId,
            iat: Date.now(),
        };
        discloseDemand = buildDiscloseDemand(
            discloseDemandPayload,
            NftSupport.genesisPassphrase,
            issuerTokenId,
            NftSupport.genesisPassphrase,
        );
        await NftSupport.mintAndWait(tokenId);
        await NftSupport.mintAndWait(issuerTokenId);
    });

    it("disclose explicit values", async () => {
        const disclose = await discloseAndWait(discloseDemand);
        await expect(disclose.id).toBeForged();
        await expect({
            tokenId,
            properties: { [EXPLICIT_PROP_KEY]: discloseDemand["disclose-demand"].payload.explicitValue.join(",") },
        }).toMatchProperties();
    });

    it("update with new disclosed value", async () => {
        let disclose = await discloseAndWait(discloseDemand);
        await expect(disclose.id).toBeForged();

        const discloseDemandPayload = {
            explicitValue: ["explicitValue3"],
            sub: tokenId,
            type: DIDTypes.INDIVIDUAL,
            iss: tokenId,
            iat: Date.now(),
        };
        const newDiscloseDemand = buildDiscloseDemand(
            discloseDemandPayload,
            NftSupport.genesisPassphrase,
            issuerTokenId,
            NftSupport.genesisPassphrase,
        );

        disclose = await discloseAndWait(newDiscloseDemand);
        await expect(disclose.id).toBeForged();

        const expectedValues = discloseDemandPayload.explicitValue.concat(
            discloseDemand["disclose-demand"].payload.explicitValue,
        );
        await expect({
            tokenId,
            properties: { [EXPLICIT_PROP_KEY]: expectedValues.join(",") },
        }).toMatchProperties();
    });

    it("change order of disclosed values", async () => {
        let disclose = await discloseAndWait(discloseDemand);
        await expect(disclose.id).toBeForged();

        const discloseDemandPayload = {
            explicitValue: ["explicitValue2"],
            sub: tokenId,
            type: DIDTypes.INDIVIDUAL,
            iss: tokenId,
            iat: Date.now(),
        };
        const newDiscloseDemand = buildDiscloseDemand(
            discloseDemandPayload,
            NftSupport.genesisPassphrase,
            issuerTokenId,
            NftSupport.genesisPassphrase,
        );

        disclose = await discloseAndWait(newDiscloseDemand);
        await expect(disclose.id).toBeForged();

        const expectedValues = ["explicitValue2", "explicitValue1"];
        await expect({
            tokenId,
            properties: { [EXPLICIT_PROP_KEY]: expectedValues.join(",") },
        }).toMatchProperties();
    });
});
