import "jest-extended";
import "../mocks/core-container";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Transactions as NftTransactions } from "../../../../packages/core-nft-crypto/src";
import {
    NftTransactionGroup,
    NftTransactionStaticFees,
    NftTransactionType,
} from "../../../../packages/core-nft-crypto/src/enums";
import { network, nftId, nftName } from "../__fixtures__";

let builder: Builders.NftMintBuilder;

describe("Nft Mint Transaction", () => {
    Managers.configManager.setFromPreset(network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftMintTransaction);

    beforeEach(() => {
        builder = new Builders.NftMintBuilder(nftName, nftId);
    });

    describe("should test verification", () => {
        it("should verify correctly with single passphrase", () => {
            const actual = builder.sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly with second signature", () => {
            const actual = builder.sign("passphrase").secondSign("second passphrase");

            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });

        it("should verify correctly properties", () => {
            const actual = builder
                .properties({ propKey: "propValue" })
                .nonce("3")
                .sign("passphrase");
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
            expect(builder).toHaveProperty("data.asset", { nft: { [nftName]: { tokenId: nftId } } });
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.nonce");
        });

        it("should not have properties", () => {
            expect(builder).not.toHaveProperty("data.nft");
        });
    });
});
