import "jest-extended";

import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";

import { Builders, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import * as Fixtures from "../__fixtures__";
import { checkCommonFields } from "../helpers";
import { testNftAssetSchema } from "./schemas-utils";

describe("Nft transfer transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftTransferTransaction);

    describe("Ser/deser", () => {
        it(`should ser/deserialize with recipient`, () => {
            const transaction = new Builders.NftTransferBuilder(Fixtures.nftName, Fixtures.nftId)
                .recipientId(Fixtures.recipient)
                .sign("passphrase")
                .getStruct();

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

        test.each(Fixtures.propertiesAssets)("should ser/deserialize with properties", propertiesAsset => {
            const transaction = new Builders.NftTransferBuilder(Fixtures.nftName, Fixtures.nftId)
                .properties(propertiesAsset)
                .recipientId(Fixtures.recipient)
                .sign("passphrase")
                .getStruct();

            const serialized = Transactions.TransactionFactory.fromData(transaction).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transaction);

            let nftfields: any = {
                tokenId: Fixtures.nftId,
            };
            if (Object.keys(propertiesAsset).length) {
                nftfields = { ...nftfields, properties: propertiesAsset };
            }
            const expectedAsset = {
                nft: {
                    [Fixtures.nftName]: nftfields,
                },
            };
            expect(deserialized.data.asset).toStrictEqual(expectedAsset);
        });
    });

    describe("Schema tests", () => {
        const transactionSchema = NftTransactions.NftTransferTransaction.getSchema();
        const builder: Builders.NftTransferBuilder = new Builders.NftTransferBuilder(Fixtures.nftName, Fixtures.nftId);

        it(`should valid schema with recipient`, () => {
            builder.recipientId(Fixtures.recipient).sign("passphrase");

            const { error } = Ajv.validator.validate(transactionSchema, builder.getStruct());
            expect(error).toBeUndefined();
        });

        testNftAssetSchema(
            NftTransactions.NftTransferTransaction,
            new Builders.NftTransferBuilder(Fixtures.nftName, Fixtures.nftId).recipientId(Fixtures.recipient),
        );
    });
});
