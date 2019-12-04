import { Managers, Transactions, Validation as Ajv } from "@arkecosystem/crypto";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import "jest-extended";
import { DiscloseExplicitTransaction } from "../../../../packages/uns-crypto/src";
import { checkCommonFields } from "../../core-nft/helpers";
import * as Fixtures from "../__fixtures__";
import { discloseExplicitTransaction } from "../__fixtures__";

describe("Uns Disclose Explicit Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    // TODO: uns : we must register nft-mint type because disclose explicit requires schema reference token id
    // which is declared and exposed by nft schemas.
    // It means that uns transactions can't work without nft plugin loaded
    // Maybe it could be improved
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftMintTransaction);
    Transactions.TransactionRegistry.registerTransactionType(DiscloseExplicitTransaction);

    describe("Ser/deser", () => {
        it("should ser/deserialize without error", () => {
            const transaction = discloseExplicitTransaction().getStruct();
            const serialized = Transactions.TransactionFactory.fromData(transaction).serialized.toString("hex");
            const deserialized = Transactions.Deserializer.deserialize(serialized);

            checkCommonFields(deserialized, transaction);
            expect(deserialized.data.asset).toStrictEqual(transaction.asset);
        });
    });

    describe("Schema tests", () => {
        it("should validate schema without errors", () => {
            const transaction = discloseExplicitTransaction().getStruct();
            const { error } = Ajv.validator.validate(DiscloseExplicitTransaction.getSchema(), transaction);
            expect(error).toBeUndefined();
        });
    });
});
