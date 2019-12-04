import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import "jest-extended";
import {
    DiscloseExplicitTransaction,
    unsCrypto,
    UnsTransactionGroup,
    UnsTransactionStaticFees,
    UnsTransactionType,
} from "../../../../packages/uns-crypto/src";
import * as Fixtures from "../__fixtures__";

describe("Uns Disclose Explicit Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    // TODO: uns : we must register nft-mint type because disclose explicit requires schema reference token id
    // which is declared and exposed by nft schemas.
    // It means that uns transactions can't work without nft plugin loaded
    // Maybe it could be improved
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftMintTransaction);
    Transactions.TransactionRegistry.registerTransactionType(DiscloseExplicitTransaction);

    describe("should verify", () => {
        it("with a signature", () => {
            expect(Fixtures.discloseExplicitTransaction().build().verified).toBeTrue();
            expect(Fixtures.discloseExplicitTransaction().verify()).toBeTrue();
        });
        it("with second signature", () => {
            const transaction = Fixtures.discloseExplicitTransaction().secondSign("second passphrase");
            expect(transaction.build().verified).toBeTrue();
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("should have properties", () => {
        it("specific", () => {
            const builder = Fixtures.discloseExplicitTransaction().secondSign("second passphrase");

            expect(builder).toHaveProperty("data.type", UnsTransactionType.UnsDiscloseExplicit);
            expect(builder).toHaveProperty("data.typeGroup", UnsTransactionGroup);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty(
                "data.fee",
                Utils.BigNumber.make(UnsTransactionStaticFees.UnsDiscloseExplicit),
            );
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.asset.disclose-demand", Fixtures.discloseDemand["disclose-demand"]);
            expect(builder).toHaveProperty(
                "data.asset.disclose-demand-certification",
                Fixtures.discloseDemand["disclose-demand-certification"],
            );
        });

        it("with valid payload signatures", () => {
            const builder = Fixtures.discloseExplicitTransaction();

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
