import "jest-extended";

import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";

import { Builders, Transactions as NftTransactions } from "../../../../packages/core-nft-crypto/src";
import * as Fixtures from "../__fixtures__";
import { checkCommonFields } from "../helpers";

let builder: Builders.NftMintBuilder;

describe("Nft mint transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftMintTransaction);

    describe("Ser/deser", () => {
        beforeEach(() => {
            builder = new Builders.NftMintBuilder(Fixtures.nftName, Fixtures.nftId);
        });

        it("should ser/deserialize without properties", () => {
            const transaction = builder.sign("passphrase").getStruct();

            const serialized = Transactions.TransactionFactory.fromData(transaction).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transaction);
            const expectedAsset = {
                nft: {
                    [Fixtures.nftName]: {
                        tokenId: Fixtures.nftId,
                    },
                },
            };
            expect(deserialized.data.asset).toStrictEqual(expectedAsset);
        });

        for (let i = 0; i < Fixtures.propertiesAssets.length; i++) {
            const propertiesAsset = Fixtures.propertiesAssets[i];
            it(`should ser/deserialize with properties (${i})`, () => {
                const transaction = builder
                    .properties(propertiesAsset)
                    .sign("passphrase")
                    .getStruct();

                const serialized = Transactions.TransactionFactory.fromData(transaction).serialized.toString("hex");
                const deserialized = Transactions.Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, transaction);
                const expectedAsset = {
                    nft: {
                        [Fixtures.nftName]: {
                            tokenId: Fixtures.nftId,
                            properties: propertiesAsset,
                        },
                    },
                };
                expect(deserialized.data.asset).toStrictEqual(expectedAsset);
            });
        }
    });

    describe("Schema tests", () => {
        let transactionSchema;

        beforeAll(() => {
            transactionSchema = NftTransactions.NftMintTransaction.getSchema();
        });

        beforeEach(() => {
            builder = new Builders.NftMintBuilder(Fixtures.nftName, Fixtures.nftId);
        });

        it("should validate schema without properties", () => {
            builder.sign("passphrase");
            const { error } = Ajv.validator.validate(transactionSchema, builder.getStruct());
            expect(error).toBeUndefined();
        });

        for (let i = 0; i < Fixtures.propertiesAssets.length; i++) {
            const propertiesAsset = Fixtures.propertiesAssets[i];

            it(`should  validate schema with properties (${i}) `, () => {
                builder.properties(propertiesAsset).sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, builder.getStruct());
                expect(error).toBeUndefined();
            });
        }

        it("should return errors because property value max length is 255 char", () => {
            builder
                .properties({
                    tooLong: "a".repeat(256),
                })
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, builder.getStruct());
            expect(error).not.toBeUndefined();
        });

        it("should return errors because property key max length is 255 char", () => {
            const businessRegistration = builder
                .properties({
                    ["a".repeat(256)]: "tooLong",
                })
                .sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).not.toBeUndefined();
        });
    });
});
