import { app } from "@arkecosystem/core-container";
import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { Bignum, crypto, DiscloseDemandPayload } from "../../../../../packages/crypto/dist";
import { DIDTypes } from "../../../../../packages/crypto/src/models";
import { TransactionFactory } from "../../../../helpers/transaction-factory";
import "../../../../utils";
import { buildDiscloseDemand } from "../../../../utils/helpers";
import { setUp, tearDown } from "../../__support__/setup";
import { utils } from "../utils";

beforeAll(async () => {
    await setUp();
});

afterAll(async () => {
    await tearDown();
});

describe("API 2.0 - POST /transactions types", () => {
    describe("Disclose explicit transaction", () => {
        it("should be accepted in the transaction pool", async () => {
            const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
            const TOKEN_ID = "6f35a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
            const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
            const CERTIF_ISSUER_PASSPHRASE = "iss secret";
            const CERTIF_ISSUER_UNIK_ID = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
            const ownerKeys = crypto.getKeys(OWNER_PASSPHRASE);
            const ownerAdress = crypto.getAddress(ownerKeys.publicKey);

            const certifIssuerKeys = crypto.getKeys(CERTIF_ISSUER_PASSPHRASE);
            const certifIssuerAddress = crypto.getAddress(certifIssuerKeys.publicKey);

            const ownerWallet = {
                address: ownerAdress,
                publicKey: ownerKeys.publicKey,
                secondPublicKey: null,
                balance: new Bignum(100000000),
                vote: "",
                voted: false,
                username: null,
                lastBlock: {},
                voteBalance: new Bignum(5),
                dirty: false,
                producedBlocks: 0,
                forgedFees: Bignum.ZERO,
                forgedRewards: Bignum.ZERO,
                tokens: [TOKEN_ID],
                verifySignatures: (_, __) => {
                    return true;
                },
            };

            jest.spyOn(databaseService.walletManager, "findByAddress").mockReturnValue(ownerWallet);

            jest.spyOn(databaseService.nftsBusinessRepository, "findById").mockImplementation(id => {
                let nft;
                switch (id) {
                    case TOKEN_ID:
                        nft = { id: TOKEN_ID, ownerId: ownerAdress };
                        break;
                    case CERTIF_ISSUER_UNIK_ID:
                        nft = { id: CERTIF_ISSUER_UNIK_ID, ownerId: certifIssuerAddress };
                        break;
                    default:
                        nft = null;
                }
                return new Promise(resolve => {
                    resolve(nft);
                });
            });

            jest.spyOn(databaseService.transactionsBusinessRepository, "getPublicKeyFromAddress").mockImplementation(
                addr => {
                    switch (addr) {
                        case ownerAdress:
                            return ownerKeys.publicKey;
                        case certifIssuerAddress:
                            return certifIssuerKeys.publicKey;
                        default:
                            return null;
                    }
                },
            );

            jest.spyOn(databaseService.walletManager, "findByPublicKey").mockReturnValueOnce(ownerWallet);

            const discloseDemandPayload: DiscloseDemandPayload = {
                explicitValue: ["explicitValue1", "anotherExplicitvalue"],
                sub: TOKEN_ID,
                type: DIDTypes.NETWORK,
                iss: TOKEN_ID,
                iat: new Date().getTime(),
            };
            const discloseDemand = buildDiscloseDemand(
                discloseDemandPayload,
                OWNER_PASSPHRASE,
                CERTIF_ISSUER_UNIK_ID,
                CERTIF_ISSUER_PASSPHRASE,
            );

            const transactions = TransactionFactory.unsDiscloseExplicit(discloseDemand)
                .withNetwork("testnet")
                .withPassphrase(OWNER_PASSPHRASE)
                .create();
            const response = await utils.request("POST", "transactions", {
                transactions,
            });
            expect(response).toBeSuccessfulResponse();

            expect(response.data.data.accept).toHaveLength(1);
            expect(response.data.data.accept[0]).toBe(transactions[0].id);

            expect(response.data.data.broadcast).toHaveLength(1);
            expect(response.data.data.broadcast[0]).toBe(transactions[0].id);
            expect(response.data.data.invalid).toHaveLength(0);
            const transactionPool = app.resolvePlugin<TransactionPool.IConnection>("transaction-pool");
            transactionPool.flush();
        });
    });
});
