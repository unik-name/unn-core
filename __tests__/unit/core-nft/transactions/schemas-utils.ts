import { Validation } from "@arkecosystem/crypto";
import { Transactions } from "@uns/core-nft-crypto";
import clonedeep from "lodash.clonedeep";
import * as Fixtures from "../__fixtures__";

export const testNftAssetSchema = (transactionType, BuilderInit) => {
    describe("Schema tests", () => {
        let builder;
        const transactionSchema = transactionType.getSchema();
        beforeEach(() => {
            builder = clonedeep(BuilderInit);
        });

        test.each(Fixtures.propertiesAssets)("should  validate schema with properties", propertiesAsset => {
            builder.properties(propertiesAsset).sign("passphrase");
            const { error } = Validation.validator.validate(transactionSchema, builder.getStruct());
            if (transactionType === Transactions.NftUpdateTransaction && !Object.keys(propertiesAsset).length) {
                expect(error).toMatch("should have required property 'properties'");
            } else {
                expect(error).toBeUndefined();
            }
        });

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
