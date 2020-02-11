/* tslint:disable:ordered-imports*/
import "jest-extended";
import "../mocks/core-container";
import { Interfaces } from "@arkecosystem/crypto";
import { app } from "@arkecosystem/core-container";
import {
    setExplicitValue,
    EXPLICIT_PROP_KEY,
    revertExplicitValue,
} from "@uns/uns-transactions/src/handlers/utils/helpers";
import { UnsTransactionType, UnsTransactionGroup } from "@uns/crypto";
import { dummyTransaction } from "../__fixtures__";
import { nftRepository } from "@uns/core-nft/src";

describe("Disclose-explicit - setExplicitValue tests", () => {
    const nftManager = app.resolvePlugin("core-nft");
    const TOKEN_ID = "tokenId";
    const transaction = ({
        type: UnsTransactionType.UnsDiscloseExplicit,
        typeGroup: UnsTransactionGroup,
        id: "dummy",
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
    let transactionClone;

    describe("No explicit value already disclosed", () => {
        beforeAll(() => {
            // deep clone transaction
            transactionClone = JSON.parse(JSON.stringify(transaction));
        });
        it("should insert single new property", async () => {
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith({ [EXPLICIT_PROP_KEY]: "discloseMe" }, TOKEN_ID);
        });

        it("should insert 3 new explicit values", async () => {
            const explicitValues = ["value1", "value2", "value3"];
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = explicitValues;
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith(
                { [EXPLICIT_PROP_KEY]: explicitValues.join(",") },
                TOKEN_ID,
            );
        });

        it("should do nothing", async () => {
            const explicitValues = [];
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = explicitValues;
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith({ [EXPLICIT_PROP_KEY]: "" }, TOKEN_ID);
        });

        it("should not set duplicate values", async () => {
            const explicitValues = ["value", "value"];
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = explicitValues;
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith({ [EXPLICIT_PROP_KEY]: "value" }, TOKEN_ID);
        });
    });

    describe("update explicit values", () => {
        const initialValues = "tata,titi";
        beforeAll(() => {
            nftManager.getProperty.mockReturnValue({ value: initialValues });
            // deep clone transaction
            transactionClone = JSON.parse(JSON.stringify(transaction));
        });

        it("should add property in first place", async () => {
            const newValStr = "discloseMeFirst";
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = [newValStr];
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith(
                { [EXPLICIT_PROP_KEY]: [newValStr, initialValues].join(",") },
                TOKEN_ID,
            );
        });

        it("should put titi first", async () => {
            const newValStr = "titi";
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = [newValStr];
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith(
                { [EXPLICIT_PROP_KEY]: newValStr + ",tata" },
                TOKEN_ID,
            );
        });

        it("should do nothing", async () => {
            const newValStr = "tata";
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = [newValStr];
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith({ [EXPLICIT_PROP_KEY]: initialValues }, TOKEN_ID);
        });

        it("should set toto,tata,titi", async () => {
            const newValArray = ["toto", "tata"];
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = newValArray;
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith(
                { [EXPLICIT_PROP_KEY]: newValArray.join(",") + ",titi" },
                TOKEN_ID,
            );
        });

        it("should set tata,toto,titi", async () => {
            const newValArray = ["tata", "toto"];
            transactionClone.data.asset["disclose-demand"].payload.explicitValue = newValArray;
            await setExplicitValue(transactionClone);
            expect(nftManager.manageProperties).toHaveBeenCalledWith(
                { [EXPLICIT_PROP_KEY]: newValArray.join(",") + ",titi" },
                TOKEN_ID,
            );
        });
        afterAll(() => {
            nftManager.getProperty.mockRestore();
        });
    });

    describe("revert explicit values", () => {
        beforeEach(() => {
            nftManager.manageProperties.mockClear();
        });

        describe("revert newly disclosed", () => {
            beforeEach(() => {
                jest.spyOn(nftRepository(), "findTransactionsByAsset").mockImplementation(async () => {
                    return new Promise(resolve => {
                        resolve([dummyTransaction]);
                    });
                });
            });

            it("revert nft property", async () => {
                await setExplicitValue(transaction);
                expect(nftManager.manageProperties).toHaveBeenNthCalledWith(
                    1,
                    { [EXPLICIT_PROP_KEY]: "discloseMe" },
                    TOKEN_ID,
                );

                await revertExplicitValue(transaction.data);
                expect(nftManager.manageProperties).toHaveBeenNthCalledWith(
                    2,
                    { [EXPLICIT_PROP_KEY]: "dummyExplicit" },
                    TOKEN_ID,
                );
            });
        });

        describe("revert update of disclosed values", () => {
            beforeEach(() => {
                transactionClone = JSON.parse(JSON.stringify(dummyTransaction));
                transactionClone.asset["disclose-demand"].payload.explicitValue = ["tatapwet"];
                jest.spyOn(nftRepository(), "findTransactionsByAsset").mockImplementation(async () => {
                    return new Promise(resolve => {
                        resolve([transactionClone, dummyTransaction]);
                    });
                });
            });

            it("revert nft property", async () => {
                await revertExplicitValue(transaction.data);
                expect(nftManager.manageProperties).toHaveBeenCalledWith(
                    { [EXPLICIT_PROP_KEY]: "dummyExplicit,tatapwet" },
                    TOKEN_ID,
                );
            });
        });
    });
});
