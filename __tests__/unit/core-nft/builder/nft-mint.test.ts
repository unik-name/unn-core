import "jest-extended";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { NftBuilders, NftTransactions } from "../../../../packages/core-nft-crypto/src";
import {
    NftTransactionGroup,
    NftTransactionStaticFees,
    NftTransactionType,
} from "../../../../packages/core-nft-crypto/src/enums";

let builder: NftBuilders.NftMintBuilder;
const nftName = "myNft";
const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

beforeEach(() => {
    builder = new NftBuilders.NftMintBuilder(nftName, TOKEN_ID);
});

describe("Nft Mint Transaction", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftMintTransaction);

    describe("verify", () => {
        it("should be valid with a signature", () => {
            const actual = builder.sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly with double passphrase", () => {
            const actual = builder.sign("passphrase").secondSign("second passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly properties", () => {
            const actual = builder
                .properties({ propKey: "propValue" })
                .nonce("3")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("should test properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", NftTransactionType.NftMint);
            expect(builder).toHaveProperty("data.typeGroup", NftTransactionGroup);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", Utils.BigNumber.make(NftTransactionStaticFees.NftMint));
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.senderPublicKey", undefined);
            expect(builder).toHaveProperty("data.asset", { nft: { [nftName]: { tokenId: TOKEN_ID } } });
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.nonce");
        });

        it("should not have properties", () => {
            expect(builder).not.toHaveProperty("data.nft");
        });
    });

    describe("should test nftMint asset", () => {
        it("should test name and website", () => {
            const properties = { propKey: "propValue", propKey2: "propValue2" };
            builder.properties(properties);
            expect(builder.data.asset.nft[nftName].properties).toBe(properties);
        });
    });
});
