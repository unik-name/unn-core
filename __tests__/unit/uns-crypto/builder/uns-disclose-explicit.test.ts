import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import {
    DiscloseExplicitTransaction,
    unsCrypto,
    UnsTransactionGroup,
    UnsTransactionStaticFees,
    UnsTransactionType,
} from "@uns/crypto";
import "jest-extended";
import * as Fixtures from "../__fixtures__";
import { discloseDemand, discloseExplicitTransaction } from "../helpers";

describe("Uns Disclose Explicit Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(DiscloseExplicitTransaction);

    describe("should verify", () => {
        it("with a signature", () => {
            expect(discloseExplicitTransaction().build().verified).toBeTrue();
            expect(discloseExplicitTransaction().verify()).toBeTrue();
        });
        it("with second signature", () => {
            const transaction = discloseExplicitTransaction().secondSign("second passphrase");
            expect(transaction.build().verified).toBeTrue();
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("should have properties", () => {
        it("specific", () => {
            const builder = discloseExplicitTransaction().secondSign("second passphrase");

            expect(builder).toHaveProperty("data.type", UnsTransactionType.UnsDiscloseExplicit);
            expect(builder).toHaveProperty("data.typeGroup", UnsTransactionGroup);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty(
                "data.fee",
                Utils.BigNumber.make(UnsTransactionStaticFees.UnsDiscloseExplicit),
            );
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.asset.disclose-demand", discloseDemand["disclose-demand"]);
            expect(builder).toHaveProperty(
                "data.asset.disclose-demand-certification",
                discloseDemand["disclose-demand-certification"],
            );
        });

        it("with valid payload signatures", () => {
            const builder = discloseExplicitTransaction();

            const isDemandVerified = unsCrypto.verifyPayload(
                builder.data.asset["disclose-demand"].payload,
                builder.data.asset["disclose-demand"].signature,
                Fixtures.demanderKeys.publicKey,
            );

            const isCertificationVerified = unsCrypto.verifyPayload(
                builder.data.asset["disclose-demand-certification"].payload,
                builder.data.asset["disclose-demand-certification"].signature,
                Fixtures.issKeys.publicKey,
            );

            expect(isDemandVerified).toBeTruthy();
            expect(isCertificationVerified).toBeTruthy();
        });
    });
});
