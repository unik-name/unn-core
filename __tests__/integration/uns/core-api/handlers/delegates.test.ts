import { app } from "@arkecosystem/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Managers } from "@arkecosystem/crypto";
import * as NftSupport from "../../../../functional/transaction-forging/__support__/nft";
import { buildDelegatePool } from "../../../../unit/uns-crypto/helpers";
import { tearDown } from "../../../core-api/__support__/setup";
import { utils } from "../../../core-api/utils";

let wm: State.IWalletManager;

beforeAll(async () => {
    await NftSupport.setUp();
    wm = app.resolvePlugin("database").walletManager;
    buildDelegatePool(wm, 10);
});

afterAll(tearDown);

describe("API 2.0 - Delegates", () => {
    describe("GET /delegates", () => {
        it("should GET all delegates", async () => {
            const response = await utils.request("GET", "delegates");
            expect(response).toBeSuccessfulResponse();
            expect(response.data.data).toBeArray();

            for (const delegate of response.data.data) {
                utils.expectDelegate(delegate);
            }
            expect(response.data.data.sort((a, b) => a.rank < b.rank)).toEqual(response.data.data);
        });

        it("should GET approval percentages", async () => {
            const response = await utils.request("GET", "delegates");
            expect(response).toBeSuccessfulResponse();
            const delegates = response.data.data;
            expect(delegates).toBeArray();

            // Sum of percentages by types must be equal to 100
            let percentageSum = delegates
                .filter(delegate => delegate.type === "individual")
                .reduce((sum, delegate) => sum + delegate.production.approval, 0);

            expect(Math.round(percentageSum)).toEqual(100);

            percentageSum = delegates
                .filter(delegate => delegate.type === "organization")
                .reduce((sum, delegate) => sum + delegate.production.approval, 0);

            expect(Math.round(percentageSum)).toEqual(100);

            percentageSum = delegates
                .filter(delegate => delegate.type === "network")
                .reduce((sum, delegate) => sum + delegate.production.approval, 0);

            expect(Math.round(percentageSum)).toEqual(100);

            // Ensure custom ranking is respected
            const nbDelegatesByType = Managers.configManager.getMilestone().nbDelegatesByType;
            expect(delegates[nbDelegatesByType.individual - 1].rank).toEqual(nbDelegatesByType.individual);
            expect(delegates[nbDelegatesByType.organization - 1].rank).toEqual(nbDelegatesByType.organization);
            expect(delegates[nbDelegatesByType.network - 1].rank).toEqual(nbDelegatesByType.network);
        });
    });
});
