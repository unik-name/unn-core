import "jest-extended";
import "../mocks/core-container";
import { nftsFindPropertyByKeyMock } from "../mocks/database-manager";

import { Transactions as NFTTransactions } from "../../../../packages/core-nft-crypto/src/";
import { ConstraintsManager } from "../../../../packages/core-nft/src/constraints/manager";
import { Managers, Transactions } from "../../../../packages/crypto";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { CONSTRAINTS, NETWORK, NFT_ID, NFT_NAME } from "../__fixtures__";

describe("core-nft > constraint manager", () => {
    // TODO: uns : find a way to prevent transaction register just for creating transaction
    Managers.configManager.setFromPreset(NETWORK);
    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NftMintTransaction);
    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NftUpdateTransaction);

    let manager;

    beforeEach(() => {
        manager = new ConstraintsManager(CONSTRAINTS);
    });

    describe("genesis constraint", () => {
        it("should pass when all genesis properties are set", () => {
            const properties = { genesisProp: "", propertyA: "", propertyB: "" };
            const transaction = NFTTransactionFactory.nftMint(NFT_NAME, NFT_ID, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).not.toThrow();
        });

        it("should throw when one genesis property is missing", () => {
            const properties = { propertyA: "" };
            const transaction = NFTTransactionFactory.nftMint(NFT_NAME, NFT_ID, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).toThrow(/genesis properties/);
        });

        it("should pass when nft has no properties", () => {
            const constraintsMock = {
                unik: {
                    name: NFT_NAME,
                    properties: {},
                },
            };
            manager = new ConstraintsManager(constraintsMock);
            const properties = { propertyA: "", propertyB: "" };
            const transaction = NFTTransactionFactory.nftMint(NFT_NAME, NFT_ID, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).not.toThrow();
        });

        it("should pass when nft has no genesis properties", () => {
            const configMock = {
                unik: {
                    name: NFT_NAME,
                    properties: {
                        foo: {},
                    },
                },
            };
            manager = new ConstraintsManager(configMock);
            const properties = { propertyA: "", propertyB: "" };
            const transaction = NFTTransactionFactory.nftMint(NFT_NAME, NFT_ID, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).not.toThrow();
        });
    });

    describe("immutable constraint", () => {
        it("should pass, immutable property not set yet", () => {
            // tslint:disable-next-line: no-null-keyword
            nftsFindPropertyByKeyMock.mockReturnValue(null);
            const properties = { immutableProp: "1" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).resolves.toBeUndefined();
        });

        it("should throw ConstraintError, property already set", () => {
            nftsFindPropertyByKeyMock.mockReturnValueOnce("1"); // db query
            const properties = { immutableProp: "2" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/immutable/);
        });
    });

    describe("number constraint", () => {
        it("should pass, new value is in-bound", async () => {
            const properties = { numberProp: "1" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).resolves.toBeUndefined();
        });

        it("should throw ConstraintError, new value is lower bound", async () => {
            const properties = { numberProp: "-1" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/lower bound/);
        });

        it("should throw ConstraintError, new value is upper bound", async () => {
            const properties = { numberProp: "1000" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/upper bound/);
        });

        it("should throw ConstraintError, new value is not a number", async () => {
            const properties = { numberProp: "helloworld" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/not a number/);
        });
    });

    describe("enumeration constraint", () => {
        it("should pass, new value is in-bound", async () => {
            const properties = { enumProp: "foo" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).resolves.toBeUndefined();
        });

        it("should throw ConstraintError, new value is not a number", async () => {
            const properties = { enumProp: "helloworld" };
            const transaction = NFTTransactionFactory.nftUpdate(NFT_NAME, NFT_ID, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/enumeration/);
        });
    });
});
