import { configManager, getCurrentNftAsset } from "@arkecosystem/crypto";
import "jest-extended";
import { NFTUpdateBuilder } from "../../../../../../packages/crypto/src/builder/transactions/nft/nft-update";
import { client } from "../../../../../../packages/crypto/src/client";
import { TransactionTypes } from "../../../../../../packages/crypto/src/constants";
import { feeManager } from "../../../../../../packages/crypto/src/managers/fee";
import { Transaction } from "../../../../../../packages/crypto/src/transactions";

let builder: NFTUpdateBuilder;
let properties: { [_: string]: string };

const TOKEN_ID = "6f35a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
const SENDER_PK = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

beforeEach(() => {
    builder = client.getBuilder().nftUpdate(TOKEN_ID);
    properties = {
        myPropKey: "propValue",
        myPropKey2: "propValue2",
        myProp2Delete: null,
    };
    builder
        .properties(properties)
        .senderPublicKey(SENDER_PK)
        .sign(OWNER_PASSPHRASE);
});

describe("NFTUpdate Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            expect(builder.build().verified).toBeTrue();
            expect(builder.verify()).toBeTrue();
        });
    });

    describe("getStruct", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", TransactionTypes.NftUpdate);
            expect(builder).toHaveProperty("data.fee", feeManager.get(TransactionTypes.NftUpdate));
            expect(builder).toHaveProperty("data.senderPublicKey", SENDER_PK);
            expect(builder).toHaveProperty(
                `data.asset.nft.${configManager.getCurrentNftName()}.properties`,
                properties,
            );
        });

        it("should return all properties", () => {
            const transactionStruct = builder.getStruct();
            expect(transactionStruct).toHaveProperty(
                `asset.nft.${configManager.getCurrentNftName()}.properties`,
                properties,
            );
        });

        it("should return all properties after build", () => {
            const transaction: Transaction = builder.build();
            // Has to not be replaced by undefined, stay null (property is removed from structure when value is undefined)
            expect(getCurrentNftAsset(transaction.data).properties.myProp2Delete).toBeDefined();
            expect(getCurrentNftAsset(transaction.data).properties.myProp2Delete).toBeNull();
        });
    });
});
