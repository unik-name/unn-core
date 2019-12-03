import "jest-extended";
import "../mocks/core-container";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Transactions as NftTransactions } from "../../../../packages/core-nft-crypto/src";
import {
    NftTransactionGroup,
    NftTransactionStaticFees,
    NftTransactionType,
} from "../../../../packages/core-nft-crypto/src/enums";
import { network, nftId, nftName, recipient } from "../__fixtures__";

let builder: Builders.NftTransferBuilder;

describe("Nft Transfer Transaction", () => {
    Managers.configManager.setFromPreset(network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftTransferTransaction);

    beforeEach(() => {
        builder = new Builders.NftTransferBuilder(nftName, nftId);
        builder.recipientId(recipient);
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
            const actual = builder.nonce("3").sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });

    describe("should test properties", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", NftTransactionType.NftTransfer);
            expect(builder).toHaveProperty("data.typeGroup", NftTransactionGroup);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty("data.fee", Utils.BigNumber.make(NftTransactionStaticFees.NftMint));
            expect(builder).toHaveProperty("data.recipientId", recipient);
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
