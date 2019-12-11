import * as support from "../../../../functional/transaction-forging/__support__";
import * as NftSupport from "../../../../functional/transaction-forging/__support__/nft";
import { utils } from "../../utils";

beforeAll(NftSupport.setUp);
afterAll(support.tearDown);

describe("API 2.0 - NFTS", () => {
    describe("GET /nfts/status", () => {
        it("should GET the blockchain nfts names", async () => {
            const response = await utils.request("GET", "nfts/status");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();
            expect(response.data.data).toEqual(["unik"]);
        });

        it("should GET the empty UNIK tokens status", async () => {
            const response = await utils.request("GET", "uniks/status");
            expect(response).toBeSuccessfulResponse();
            const expectedUnikStatus = {
                nftName: "UNIK",
                individual: "0",
                organization: "0",
                network: "0",
            };
            expect(response.data.data).toEqual(expectedUnikStatus);
        });

        it("should GET the UNIK tokens status", async () => {
            const nftId = NftSupport.generateNftId();
            await NftSupport.mintAndWait(nftId);

            const response = await utils.request("GET", "uniks/status");
            expect(response).toBeSuccessfulResponse();
            const expectedUnikStatus = {
                nftName: "UNIK",
                individual: "1",
                organization: "0",
                network: "0",
            };

            expect(response.data.data).toEqual(expectedUnikStatus);
        });
    });
});
