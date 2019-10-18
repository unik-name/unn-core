/* tslint:disable:ordered-imports*/
import "jest-extended";
import "../mocks/core-container";
import { UNSDiscloseExpliciteHandler } from "../../../../packages/core-nft/src/handlers/transactions";
import { NFTModifier } from "../../../../packages/core-nft/src/modifier";
import { ITransactionData } from "../../../../packages/crypto/src";

describe("uns-disclose-explicit - onApplied tests", () => {
    const TOKEN_ID = "tokenId";
    let explicitValueStr = "";

    const transaction = {
        asset: {
            "disclose-demand": {
                payload: {
                    sub: TOKEN_ID,
                    explicitValue: ["discloseMe"],
                },
            },
        },
    } as ITransactionData;

    describe("No explicit value already disclosed", () => {
        beforeEach(() => {
            jest.spyOn(NFTModifier, "insertProperty").mockImplementationOnce(async (_, explicitValuesStr, __) => {
                return new Promise(resolve => {
                    resolve(explicitValuesStr);
                });
            });
            jest.spyOn(NFTModifier, "getProperty").mockReturnValueOnce(null);
        });

        it("should insert single new property", async () => {
            explicitValueStr = await UNSDiscloseExpliciteHandler.onApplied(transaction);
            expect(explicitValueStr).toEqual("discloseMe");
        });

        it("should insert 3 new properties", async () => {
            const explicitValues = ["value1", "value2", "value3"];
            transaction.asset["disclose-demand"].payload.explicitValue = explicitValues;
            explicitValueStr = await UNSDiscloseExpliciteHandler.onApplied(transaction);
            expect(explicitValueStr).toEqual(explicitValues.join(","));
        });

        it("should do nothing", async () => {
            const explicitValues = [];
            transaction.asset["disclose-demand"].payload.explicitValue = explicitValues;
            explicitValueStr = await UNSDiscloseExpliciteHandler.onApplied(transaction);
            expect(explicitValueStr).toBeUndefined();
        });
    });

    describe("update explicit values", () => {
        const initialValues = "tata,titi";
        beforeEach(() => {
            explicitValueStr = initialValues;
            jest.spyOn(NFTModifier, "updateProperty").mockImplementationOnce(async (_, explicitValuesStr, __) => {
                return new Promise(resolve => {
                    resolve(explicitValuesStr);
                });
            });
            jest.spyOn(NFTModifier, "getProperty").mockReturnValueOnce(
                new Promise(resolve => {
                    resolve({ value: explicitValueStr });
                }),
            );
        });

        it("should add property", async () => {
            transaction.asset["disclose-demand"].payload.explicitValue = ["discloseMe"];
            explicitValueStr = await UNSDiscloseExpliciteHandler.onApplied(transaction);
            expect(explicitValueStr).toEqual(initialValues + ",discloseMe");
        });

        it("should do nothing", async () => {
            transaction.asset["disclose-demand"].payload.explicitValue = ["tata"];
            explicitValueStr = await UNSDiscloseExpliciteHandler.onApplied(transaction);
            expect(explicitValueStr).toBeUndefined();
        });

        it("should add toto value only", async () => {
            transaction.asset["disclose-demand"].payload.explicitValue = ["tata", "toto"];
            explicitValueStr = await UNSDiscloseExpliciteHandler.onApplied(transaction);
            expect(explicitValueStr).toEqual(initialValues + ",toto");
        });
    });
});
