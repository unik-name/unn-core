/* tslint:disable:ordered-imports*/
import "jest-extended";
import "../__stubs__/core-container";
import { Interfaces } from "@arkecosystem/crypto";
import { app } from "@arkecosystem/core-container";
import { setExplicitValue } from "@uns/uns-transactions/src/handlers/utils/helpers";

describe("Disclose-explicit - setExplicitValue tests", () => {
    const nftManager = app.resolvePlugin("core-nft");
    const TOKEN_ID = "tokenId";
    let explicitValueStr: string;
    const transaction = ({
        data: {
            asset: {
                "disclose-demand": {
                    payload: {
                        sub: TOKEN_ID,
                        explicitValue: ["discloseMe"],
                    },
                },
            },
        },
    } as unknown) as Interfaces.ITransaction;

    describe("No explicit value already disclosed", () => {
        beforeEach(() => {
            jest.spyOn(nftManager, "insertProperty").mockImplementationOnce(async (_, explicitValuesStr, __) => {
                return new Promise(resolve => {
                    resolve(explicitValuesStr);
                });
            });
        });

        it("should insert single new property", async () => {
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toEqual("discloseMe");
        });

        it("should insert 3 new explicit values", async () => {
            const explicitValues = ["value1", "value2", "value3"];
            transaction.data.asset["disclose-demand"].payload.explicitValue = explicitValues;
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toEqual(explicitValues.join(","));
        });

        it("should do nothing", async () => {
            const explicitValues = [];
            transaction.data.asset["disclose-demand"].payload.explicitValue = explicitValues;
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toBeUndefined();
        });
    });

    describe("update explicit values", () => {
        const initialValues = "tata,titi";
        beforeEach(() => {
            jest.spyOn(nftManager, "getProperty").mockImplementationOnce(async (_, __) => {
                return new Promise(resolve => {
                    resolve({ value: initialValues });
                });
            });

            jest.spyOn(nftManager, "updateProperty").mockImplementationOnce(async (_, explicitValuesStr, __) => {
                return new Promise(resolve => {
                    resolve(explicitValuesStr);
                });
            });
        });

        it("should add property in first place", async () => {
            const newValStr = "discloseMe";
            transaction.data.asset["disclose-demand"].payload.explicitValue = [newValStr];
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toEqual([newValStr, initialValues].join(","));
        });

        it("should put titi first", async () => {
            const newValStr = "titi";
            transaction.data.asset["disclose-demand"].payload.explicitValue = [newValStr];
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toEqual(newValStr + ",tata");
        });

        it("should do nothing", async () => {
            const newValStr = "tata";
            transaction.data.asset["disclose-demand"].payload.explicitValue = [newValStr];
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toEqual(initialValues);
        });

        it("should set toto,tata,titi", async () => {
            const newValArray = ["toto", "tata"];
            transaction.data.asset["disclose-demand"].payload.explicitValue = newValArray;
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toEqual(newValArray.join(",") + ",titi");
        });

        it("should set tata,toto,titi", async () => {
            const newValArray = ["tata", "toto"];
            transaction.data.asset["disclose-demand"].payload.explicitValue = newValArray;
            explicitValueStr = await setExplicitValue(transaction);
            expect(explicitValueStr).toEqual(newValArray.join(",") + ",titi");
        });
    });
});
