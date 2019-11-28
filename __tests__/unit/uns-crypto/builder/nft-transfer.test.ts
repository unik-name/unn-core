import "jest-extended";
const TOKEN_ID = "6f35a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
const RECEIVER = "APyFYXxXtUrvZFnEuwLopfst94GMY5Zkeq";

import { Builders, Transactions as NftTransactions } from "@uns/core-nft-crypto";

import { Managers, Transactions } from "@arkecosystem/crypto";

let builder: Builders.NftTransferBuilder;

describe("NftTransfer builder", () => {
    Managers.configManager.setFromPreset("testnet");
    Transactions.TransactionRegistry.registerTransactionType(NftTransactions.NftTransferTransaction);

    beforeEach(() => {
        builder = new Builders.NftTransferBuilder("unik", TOKEN_ID);
    });

    describe("should test verification", () => {
        it("should be true", () => {
            const actual = builder.recipientId(RECEIVER).sign("passphrase");
            expect(actual.build().verified).toBeTrue();
            expect(actual.verify()).toBeTrue();
        });
    });
});
