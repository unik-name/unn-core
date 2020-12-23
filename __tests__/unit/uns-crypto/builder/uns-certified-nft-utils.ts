import { Managers } from "@arkecosystem/crypto";
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
            expect(builder).toHaveProperty("data.asset.demand.payload.iss");
            expect(builder).toHaveProperty("data.asset.demand.payload.sub");
            expect(builder).toHaveProperty("data.asset.demand.payload.iat");
            expect(builder).toHaveProperty("data.asset.demand.payload.cryptoAccountAddress");

            expect(builder).toHaveProperty("data.asset.certification.payload.iss");
            expect(builder).toHaveProperty("data.asset.certification.payload.sub");
            expect(builder).toHaveProperty("data.asset.certification.payload.iat");
            expect(builder).toHaveProperty("data.asset.certification.payload.cost");

            expect(builder).toHaveProperty("data.amount");
            expect(builder).toHaveProperty("data.recipientId");
        });
    });
};
