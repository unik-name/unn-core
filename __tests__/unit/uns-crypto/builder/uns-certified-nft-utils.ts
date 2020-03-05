import { Identities, Managers } from "@arkecosystem/crypto";
import "jest-extended";
import * as Fixtures from "../__fixtures__";

export const testCertifiedBuilder = builder => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    describe("should verify", () => {
        it("with a signature", () => {
            expect(builder.build().verified).toBeTrue();
            expect(builder.verify()).toBeTrue();
        });
        it("with second signature", () => {
            const transaction = builder.secondSign("second passphrase");
            expect(transaction.build().verified).toBeTrue();
            expect(transaction.verify()).toBeTrue();
        });
    });

    describe("should have properties", () => {
        it("specific", () => {
            expect(builder).toHaveProperty("data.asset.certification.payload.cost", Fixtures.cost);
            expect(builder).toHaveProperty("data.amount", Fixtures.cost);
            expect(builder).toHaveProperty(
                "data.recipientId",
                Identities.Address.fromPublicKey(Fixtures.issKeys.publicKey),
            );
            expect(builder).toHaveProperty(
                "data.asset.demand.payload.cryptoAccountAddress",
                Fixtures.cryptoAccountAddress,
            );
        });
    });
};
