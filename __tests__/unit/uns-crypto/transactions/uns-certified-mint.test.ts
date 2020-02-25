import { Interfaces, Managers, Transactions, Utils, Validation as Ajv } from "@arkecosystem/crypto";
import "jest-extended";
import {
    CertifiedNftMintTransaction,
    UnsTransactionGroup,
    UnsTransactionType,
} from "../../../../packages/uns-crypto/src";
import { checkCommonFields } from "../../core-nft/helpers";
import * as Fixtures from "../__fixtures__";
import { payloadNftMintDemandCertificationSignature, tokenId, unsCertifiedNftMintTransaction } from "../__fixtures__";

describe("Uns Certified Nft Mint Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(CertifiedNftMintTransaction);

    describe("Ser/deser", () => {
        it("should ser/deserialize without error", () => {
            const transaction = unsCertifiedNftMintTransaction().getStruct();
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
            type: UnsTransactionType.UnsCertifiedNftMint,
            fee: new Utils.BigNumber(10000000),
            senderPublicKey: "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37",
            network: undefined,
            typeGroup: UnsTransactionGroup,
            nonce: new Utils.BigNumber(0),
            asset: {},
            amount: new Utils.BigNumber(0),
        };

        const certification = {
            payload: {
                iss: "",
                sub: "",
                iat: "",
                cost: "",
            },
            signature: payloadNftMintDemandCertificationSignature,
        };

        const nft = {
            nft: {
                unik: {
                    tokenId,
                },
            },
        };

        describe("Should succeed", () => {
            beforeEach(() => {
                trx = MINIMAL_TRX;
            });
            const validateSchema = (transaction: Interfaces.ITransactionData) => {
                const { error } = Ajv.validator.validate(CertifiedNftMintTransaction.getSchema(), transaction);
                expect(error).toBeUndefined();
            };

            it("should validate schema for nominal case without errors", () => {
                const transaction = unsCertifiedNftMintTransaction().getStruct();
                validateSchema(transaction);
            });

            it("certification payload with additional attribute", () => {
                trx.asset = {
                    ...nft,
                    demand: Fixtures.nftMintDemand,
                    certification: {
                        ...certification,
                        anotherAttribute: "",
                    },
                };
                validateSchema(trx);
            });
        });

        describe("Should fail", () => {
            const validateSchemaError = (transaction: Interfaces.ITransactionData, msg?: string) => {
                const { error } = Ajv.validator.validate(CertifiedNftMintTransaction.getSchema(), transaction);
                if (msg) {
                    expect(error).toEqual(msg);
                } else {
                    expect(error).toBeDefined();
                }
            };

            beforeEach(() => {
                trx = MINIMAL_TRX;
            });

            it("empty certification payload", () => {
                trx.asset = {
                    ...nft,
                    certification: {
                        signature: payloadNftMintDemandCertificationSignature,
                    },
                };
                validateSchemaError(trx, "data.asset.certification should have required property 'payload'");
            });

            it("certification payload without iss", () => {
                trx.asset = {
                    ...nft,
                    certification: {
                        payload: {
                            sub: "",
                            iat: "",
                        },
                        signature: payloadNftMintDemandCertificationSignature,
                    },
                };
                validateSchemaError(trx, "data.asset.certification.payload should have required property '.iss'");
            });

            it("certification payload without sub", () => {
                trx.asset = {
                    ...nft,
                    certification: {
                        payload: {
                            iss: "",
                            iat: "",
                        },
                        signature: payloadNftMintDemandCertificationSignature,
                    },
                };
                validateSchemaError(trx, "data.asset.certification.payload should have required property '.sub'");
            });

            it("certification payload without iat", () => {
                trx.asset = {
                    ...nft,
                    certification: {
                        payload: {
                            iss: "",
                            sub: "",
                        },
                        signature: payloadNftMintDemandCertificationSignature,
                    },
                };
                validateSchemaError(trx, "data.asset.certification.payload should have required property '.iat'");
            });
        });
    });
});
