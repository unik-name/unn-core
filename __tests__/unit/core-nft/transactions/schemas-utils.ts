import { Validation } from "@arkecosystem/crypto";
import clonedeep from "lodash.clonedeep";
import * as Fixtures from "../__fixtures__";

export const testNftAssetSchema = (transactionType, BuilderInit) => {
    describe("Schema tests", () => {
        let builder;
        const transactionSchema = transactionType.getSchema();
        beforeEach(() => {
            builder = clonedeep(BuilderInit);
        });

        for (let i = 0; i < Fixtures.propertiesAssets.length; i++) {
            const propertiesAsset = Fixtures.propertiesAssets[i];

            it(`should  validate schema with properties (${i}) `, () => {
                builder.properties(propertiesAsset).sign("passphrase");

                const { error } = Validation.validator.validate(transactionSchema, builder.getStruct());
                expect(error).toBeUndefined();
            });
        }

        it("should return errors because property value max length is 255 char", () => {
            builder
                .properties({
                    tooLong: "a".repeat(256),
                })
                .sign("passphrase");

            const { error } = Validation.validator.validate(transactionSchema, builder.getStruct());

            expect(error).toMatch(/should NOT be longer than 255 characters/);
        });

        it("should return errors because property key max length is 255 char", () => {
            const businessRegistration = builder
                .properties({
                    ["a".repeat(256)]: "tooLong",
                })
                .sign("passphrase");

            const { error } = Validation.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toMatch(/should NOT be longer than 255 characters/);
        });
    });
};
