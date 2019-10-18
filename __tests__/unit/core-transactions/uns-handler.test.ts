/* tslint:disable:ordered-imports*/
import "jest-extended";
import "./mocks/core-container";
import { Wallet } from "@arkecosystem/core-database";
import { Bignum, crypto, DiscloseDemandPayload, ITransactionData, models, Transaction } from "@arkecosystem/crypto";
import { TransactionTypes } from "@arkecosystem/crypto/dist/constants";
import {
    DiscloseDemandCertificationSignatureError,
    DiscloseDemandSignatureError,
    DiscloseDemandSubInvalidError,
} from "../../../packages/core-transactions/src/errors";
import { TransactionHandler } from "../../../packages/core-transactions/src/handlers/transaction";
import { TransactionHandlerRegistry } from "../../../packages/core-transactions/src/index";
import { buildDiscloseDemand } from "../../utils/helpers";

let wallet: Wallet;
let transaction: ITransactionData;
let handler: TransactionHandler;
let instance: Transaction;

describe("UnsDiscloseExplicit Transaction", () => {
    const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
    const OWNER_PASSPHRASE = "owner passphrase";
    const ISS_PASSPHRASE = "iss passphrase";
    const ISS_UNIK_ID = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";

    beforeEach(() => {
        const discloseDemandPayload: DiscloseDemandPayload = {
            explicitValue: ["explicitValue", "anotherExplicitvalue"],
            sub: TOKEN_ID,
            type: models.DIDTypes.INDIVIDUAL,
            iss: TOKEN_ID,
            iat: 1234567866,
        };
        const discloseDemand = buildDiscloseDemand(
            discloseDemandPayload,
            OWNER_PASSPHRASE,
            ISS_UNIK_ID,
            ISS_PASSPHRASE,
        );
        const ownerPubKey = crypto.getKeys(OWNER_PASSPHRASE).publicKey;

        transaction = {
            version: 1,
            id: "73fd643b1e2c35d8957b0408430c2e10a59c5f0953adecba67248ae7b2cc4870",
            type: TransactionTypes.UnsDiscloseExplicit,
            timestamp: 2330322,
            amount: new Bignum(0),
            fee: new Bignum(10000000),
            senderPublicKey: ownerPubKey,
            signature:
                "304402206c26785e7c974ca3abe373f5082f812257aabe1064680c0daddfb76ece0359b7022079b8d6dc87ab8dd6b857f08c993ea4fb87e4f70dc8be31a442aa5500cae995ce",
            secondSignature: undefined,
            asset: discloseDemand,
        };

        wallet = {
            address: crypto.getAddress(ownerPubKey),
            publicKey: ownerPubKey,
            secondPublicKey: null,
            balance: new Bignum(245096190000000),
            tokens: [TOKEN_ID],
        } as Wallet;

        handler = TransactionHandlerRegistry.get(transaction.type);
        instance = Transaction.fromData(transaction);
    });

    describe("canBeApply", () => {
        it("should pass", async () => {
            await expect(handler.canBeApplied(instance, wallet)).resolves.toBeTrue();
        });

        it("should throw DiscloseDemandCertificationSignatureError", async () => {
            instance.data.asset["disclose-demand-certification"].payload.iat = 666666;
            await expect(handler.canBeApplied(instance, wallet)).rejects.toThrow(
                DiscloseDemandCertificationSignatureError,
            );
        });

        it("should throw DiscloseDemandSignatureError", async () => {
            instance.data.asset["disclose-demand"].payload.iat = 7777777;
            await expect(handler.canBeApplied(instance, wallet)).rejects.toThrow(DiscloseDemandSignatureError);
        });

        it("should throw DiscloseDemandSubInvalidError (post certification payload replacement)", async () => {
            const counterfeitDiscloseDemand: DiscloseDemandPayload = {
                explicitValue: ["modified_explicitValue"],
                sub: TOKEN_ID,
                type: models.DIDTypes.INDIVIDUAL,
                iss: TOKEN_ID,
                iat: 1234567866,
            };
            instance.data.asset["disclose-demand"] = buildDiscloseDemand(
                counterfeitDiscloseDemand,
                OWNER_PASSPHRASE,
                ISS_UNIK_ID,
                ISS_PASSPHRASE,
            )["disclose-demand"];
            await expect(handler.canBeApplied(instance, wallet)).rejects.toThrow(DiscloseDemandSubInvalidError);
        });
    });
});
