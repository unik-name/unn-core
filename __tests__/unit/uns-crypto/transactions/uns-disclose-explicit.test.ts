import { Interfaces, Managers, Transactions, Utils, Validation as Ajv } from "@arkecosystem/crypto";
import { DiscloseExplicitTransaction } from "@uns/crypto";
import "jest-extended";
import { checkCommonFields } from "../../core-nft/helpers";
import * as Fixtures from "../__fixtures__";
import { discloseExplicitTransaction } from "../helpers";

describe("Uns Disclose Explicit Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

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
        let trx: any = {};

        const MINIMAL_TRX: any = {
            id: "3184db2da1d3683d63ec9d0b75c27c459f3a751b275ee40a146663d64fc24c4b",
            signature:
                "e6e02e1dd02045c35ccf780f24d87ab795e628ee7d2f2fea89a61ceb56d18d637b03420b767d401a7e00648abbd2ed90f51f7758655c49ff69959f87720c9ce7",
            secondSignature: undefined,
            version: 2,
            type: 0,
            fee: new Utils.BigNumber(10000000),
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            network: undefined,
            typeGroup: 2001,
            nonce: new Utils.BigNumber(0),
            asset: {},
            amount: new Utils.BigNumber(0),
        };

        const certification = {
            payload: {
                iss: "",
                sub: "",
                iat: "",
            },
            signature: "abc",
        };

        const demand = {
            payload: {
                iss: "",
                sub: "",
                iat: "",
                type: "",
                explicitValue: [],
            },
            signature: "abc",
        };

        describe("Should succeed", () => {
            beforeEach(() => {
                trx = MINIMAL_TRX;
            });
            const validateDiscloseDemandSchema = (transaction: Interfaces.ITransactionData) => {
                const { error } = Ajv.validator.validate(DiscloseExplicitTransaction.getSchema(), transaction);
                expect(error).toBeUndefined();
            };

            it("should validate schema for nominal case without errors", () => {
                const transaction = discloseExplicitTransaction().getStruct();
                validateDiscloseDemandSchema(transaction);
            });

            it("disclose demand payload with additional attribute", () => {
                trx.asset = {
                    "disclose-demand": {
                        payload: {
                            anotherAttribute: "",
                        },
                        signature: "abc",
                    },
                    "disclose-demand-certification": certification,
                };
                validateDiscloseDemandSchema(trx);
            });

            it("disclose demand certification payload with additional attribute", () => {
                trx.asset = {
                    "disclose-demand": demand,
                    "disclose-demand-certification": {
                        payload: {
                            iss: "",
                            sub: "",
                            iat: "",
                            anotherAttribute: "",
                        },
                        signature: "abc",
                    },
                };
                validateDiscloseDemandSchema(trx);
            });
        });

        describe("Should fail", () => {
            const validateDiscloseDemandSchemaError = (transaction: Interfaces.ITransactionData, msg?: string) => {
                const { error } = Ajv.validator.validate(DiscloseExplicitTransaction.getSchema(), transaction);
                if (msg) {
                    expect(error).toEqual(msg);
                } else {
                    expect(error).toBeDefined();
                }
            };

            beforeEach(() => {
                trx = MINIMAL_TRX;
            });

            it("empty disclose demand certification payload", () => {
                trx.asset = {
                    "disclose-demand": demand,
                    "disclose-demand-certification": {
                        signature: "abc",
                    },
                };
                validateDiscloseDemandSchemaError(
                    trx,
                    "data.asset['disclose-demand-certification'] should have required property 'payload'",
                );
            });

            it("disclose demand certification payload without iss", () => {
                trx.asset = {
                    "disclose-demand": demand,
                    "disclose-demand-certification": {
                        payload: {
                            sub: "",
                            iat: "",
                        },
                        signature: "abc",
                    },
                };
                validateDiscloseDemandSchemaError(
                    trx,
                    "data.asset['disclose-demand-certification'].payload should have required property '.iss'",
                );
            });

            it("disclose demand certification payload without sub", () => {
                trx.asset = {
                    "disclose-demand": demand,
                    "disclose-demand-certification": {
                        payload: {
                            iss: "",
                            iat: "",
                        },
                        signature: "abc",
                    },
                };
                validateDiscloseDemandSchemaError(
                    trx,
                    "data.asset['disclose-demand-certification'].payload should have required property '.sub'",
                );
            });

            it("disclose demand certification payload without iat", () => {
                trx.asset = {
                    "disclose-demand": demand,
                    "disclose-demand-certification": {
                        payload: {
                            iss: "",
                            sub: "",
                        },
                        signature: "abc",
                    },
                };
                validateDiscloseDemandSchemaError(
                    trx,
                    "data.asset['disclose-demand-certification'].payload should have required property '.iat'",
                );
            });
        });
    });
});
