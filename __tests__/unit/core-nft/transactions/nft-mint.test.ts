import "jest-extended";

import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";
import { checkCommonFields, propertiesAssets } from "../helper";

import { NftBuilders, NftTransactions } from "../../../../packages/core-nft-crypto/src";

let builder: NftBuilders.NftMintBuilder;
const nftName = "myNft";
const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

describe("Business registration transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftMintTransaction);

    beforeEach(() => {
        builder = new NftBuilders.NftMintBuilder(nftName, TOKEN_ID);
    });

    describe("Ser/deser", () => {
        it("should ser/deserialize without properties", () => {
            const transaction = builder
                .network(23)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(transaction).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transaction);
            const expectedAsset = {
                nft: {
                    [nftName]: {
                        tokenId: TOKEN_ID,
                        properties: undefined,
                    },
                },
            };
            expect(deserialized.data.asset).toStrictEqual(expectedAsset);
        });

        for (const propertiesAsset of propertiesAssets) {
            it("should ser/deserialize with properties", () => {
                const transaction = builder
                    .properties(propertiesAsset)
                    .network(23)
                    .sign("passphrase")
                    .getStruct();

                const serialized = Transactions.TransactionFactory.fromData(transaction).serialized.toString("hex");
                const deserialized = Transactions.Deserializer.deserialize(serialized);

                checkCommonFields(deserialized, transaction);
                const expectedAsset = {
                    nft: {
                        [nftName]: {
                            tokenId: TOKEN_ID,
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

        it("should not throw any error ", () => {
            const businessRegistration = builder.network(23).sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
            expect(error).toBeUndefined();
        });
        for (const propertiesAsset of propertiesAssets) {
            it("should not throw any error ", () => {
                const businessRegistration = builder
                    .properties(propertiesAsset)
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).toBeUndefined();
            });
        }

        describe("should test edge cases for properties", () => {
            it("should fail because max length is 255 char", () => {
                const businessRegistration = builder
                    .properties({
                        tooLong: "a".repeat(256),
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });

            it("should fail because max length is 255 char", () => {
                const businessRegistration = builder
                    .properties({
                        ["a".repeat(256)]: "tooLong",
                    })
                    .network(23)
                    .sign("passphrase");

                const { error } = Ajv.validator.validate(transactionSchema, businessRegistration.getStruct());
                expect(error).not.toBeUndefined();
            });
        });
    });
});
