import { Transactions as NFTTransactions } from "@uns/core-nft-crypto";
import { ConstraintsManager } from "@uns/core-nft/src/constraints/manager";
import "jest-extended";
import { Managers, Transactions } from "../../../../packages/crypto";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
import { constraints, network, nftId, nftName } from "../__fixtures__";
import "../mocks/core-container";
import { nftsFindPropertyByKeyMock } from "../mocks/database-manager";

describe("core-nft > constraint manager", () => {
    // TODO: uns : find a way to prevent transaction register just for creating transaction
    Managers.configManager.setFromPreset(network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NftMintTransaction);
    Transactions.TransactionRegistry.registerTransactionType(NFTTransactions.NftUpdateTransaction);

    let manager;

    beforeEach(() => {
        manager = new ConstraintsManager(constraints);
    });

    describe("genesis constraint", () => {
        it("should pass when all genesis properties are set", () => {
            const properties = { genesisProp: "", propertyA: "", propertyB: "" };
            const transaction = NFTTransactionFactory.nftMint(nftName, nftId, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).not.toThrow();
        });

        it("should throw when one genesis property is missing", () => {
            const properties = { propertyA: "" };
            const transaction = NFTTransactionFactory.nftMint(nftName, nftId, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).toThrow(/genesis properties/);
        });

        it("should pass when nft has no properties", () => {
            const constraintsMock = {
                unik: {
                    name: nftName,
                    properties: {},
                },
            };
            manager = new ConstraintsManager(constraintsMock);
            const properties = { propertyA: "", propertyB: "" };
            const transaction = NFTTransactionFactory.nftMint(nftName, nftId, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).not.toThrow();
        });

        it("should pass when nft has no genesis properties", () => {
            const configMock = {
                unik: {
                    name: nftName,
                    properties: {
                        foo: {},
                    },
                },
            };
            manager = new ConstraintsManager(configMock);
            const properties = { propertyA: "", propertyB: "" };
            const transaction = NFTTransactionFactory.nftMint(nftName, nftId, properties).createOne();
            expect(() => manager.applyGenesisPropertyConstraint(transaction)).not.toThrow();
        });
    });

    describe("immutable constraint", () => {
        it("should pass, immutable property not set yet", () => {
            // tslint:disable-next-line: no-null-keyword
            nftsFindPropertyByKeyMock.mockReturnValue(null);
            const properties = { immutableProp: "1" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).resolves.toBeUndefined();
        });

        it("should throw ConstraintError, property already set", () => {
            nftsFindPropertyByKeyMock.mockReturnValueOnce("1"); // db query
            const properties = { immutableProp: "2" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/immutable/);
        });
    });

    describe("number constraint", () => {
        it("should pass, new value is in-bound", async () => {
            const properties = { numberProp: "1" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).resolves.toBeUndefined();
        });

        it("should throw ConstraintError, new value is lower bound", async () => {
            const properties = { numberProp: "-1" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/lower bound/);
        });

        it("should throw ConstraintError, new value is upper bound", async () => {
            const properties = { numberProp: "1000" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/upper bound/);
        });

        it("should throw ConstraintError, new value is not a number", async () => {
            const properties = { numberProp: "helloworld" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/not a number/);
        });
    });

    describe("enumeration constraint", () => {
        it("should pass, new value is in-bound", async () => {
            const properties = { enumProp: "foo" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).resolves.toBeUndefined();
        });

        it("should throw ConstraintError, new value is not a number", async () => {
            const properties = { enumProp: "helloworld" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(/enumeration/);
        });
    });

    describe("regex constraint", () => {
        let configMock;

        beforeEach(() => {
            configMock = {
                mynft: {
                    name: "mynft",
                    propertyKey: {
                        constraints: [
                            {
                                name: "regex",
                                parameters: {
                                    pattern: /^[a-z\_+]$/,
                                    contextAttribute: "key",
                                },
                            },
                        ],
                    },
                    properties: {},
                },
            };
        });

        it("should pass with matching", () => {
            manager = new ConstraintsManager(configMock);
            const properties = { ["matching_property+"]: "myPropertyValue" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            expect(() => manager.applyConstraints(transaction)).not.toThrow();
        });

        it("should pass without regex constraint", () => {
            delete configMock.mynft.propertyKey;
            manager = new ConstraintsManager(configMock);
            const properties = { ["#propertyKey"]: "myPropertyValue" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            expect(() => manager.applyConstraints(transaction)).not.toThrow();
        });

        it("should throw regex exception", () => {
            manager = new ConstraintsManager(configMock);
            const properties = { ["#propertyKey"]: "myPropertyValue" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(
                "Constraint violation on property '#propertyKey' (pattern regex (key: '#propertyKey', pattern: /^[a-z\\_+]$/))",
            );
        });

        it("should throw regex exception (starting space)", () => {
            manager = new ConstraintsManager(configMock);
            const properties = { [" propertyKey"]: "myPropertyValue" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(
                "Constraint violation on property ' propertyKey' (pattern regex (key: ' propertyKey', pattern: /^[a-z\\_+]$/))",
            );
        });

        it("should throw regex exception (ending space)", () => {
            manager = new ConstraintsManager(configMock);
            const properties = { ["propertyKey "]: "myPropertyValue" };
            const transaction = NFTTransactionFactory.nftUpdate(nftName, nftId, properties).createOne();
            return expect(manager.applyConstraints(transaction)).rejects.toThrow(
                "Constraint violation on property 'propertyKey ' (pattern regex (key: 'propertyKey ', pattern: /^[a-z\\_+]$/))",
            );
        });
    });
});
