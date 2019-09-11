import { httpie } from "@arkecosystem/core-utils";
import { configManager } from "@arkecosystem/crypto";
import { TransactionTypes } from "@arkecosystem/crypto/dist/constants";
import "jest-extended";
import nock from "nock";
import { NFTUpdateCommand } from "../../../../../packages/core-tester-cli/src/commands/send/nftupdate";
import { feeManager } from "../../../../../packages/crypto/src/managers/fee";
import { arkToSatoshi, captureTransactions, expectTransactions, toFlags } from "../../shared";

const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
let opts: any;
let expectedFee: number;

beforeEach(async () => {
    // Just passthru. We'll test the Command class logic in its own test file more thoroughly
    nock("http://localhost:4003")
        .get("/api/v2/node/configuration")
        .twice()
        .reply(200, { data: { constants: {} } });

    nock("http://localhost:4000")
        .get("/config")
        .twice()
        .reply(200, { data: { network: { name: "unitnet" } } });

    // Mock nft get
    nock("http://localhost:4003")
        .get(`/api/v2/nfts/${TOKEN_ID}`)
        .reply(200, { data: { constants: {} } });

    jest.spyOn(httpie, "post");

    expectedFee = feeManager.get(TransactionTypes.NftUpdate);
    opts = {
        id: TOKEN_ID,
        nftFee: expectedFee,
        props: '{"myProp": "myValue", "test": null}',
        owner: OWNER_PASSPHRASE,
    };
});

afterEach(() => {
    nock.cleanAll();
});

describe("Commands - NftUpdate", () => {
    it("should post NftUpdate Transaction", async () => {
        const expectedTransactions = [];
        captureTransactions(nock, expectedTransactions);
        await NFTUpdateCommand.run(toFlags(opts));

        expectTransactions(expectedTransactions, {
            amount: 0,
            fee: arkToSatoshi(expectedFee),
            asset: {
                nft: {
                    [configManager.getCurrentNftName()]: {
                        tokenId: TOKEN_ID,
                        properties: {
                            myProp: "myValue",
                            test: null,
                        },
                    },
                },
            },
        });
    });
});
