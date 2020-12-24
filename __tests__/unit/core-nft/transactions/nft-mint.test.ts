import { Managers, Transactions, Validation } from "@arkecosystem/crypto";
import { Builders, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import * as Fixtures from "../__fixtures__";
import { checkCommonFields } from "../helpers";
import { testNftAssetSchema } from "./schemas-utils";

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
        }
    });

    it("should validate schema without properties", () => {
        const builder = new Builders.NftMintBuilder(Fixtures.nftName, Fixtures.nftId);
        const transactionSchema = NftTransactions.NftMintTransaction.getSchema();
        builder.sign("passphrase");
        const { error } = Validation.validator.validate(transactionSchema, builder.getStruct());
        expect(error).toBeUndefined();
    });

    testNftAssetSchema(
        NftTransactions.NftMintTransaction,
        new Builders.NftMintBuilder(Fixtures.nftName, Fixtures.nftId),
    );
});
