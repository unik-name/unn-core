import { Managers, Transactions } from "@arkecosystem/crypto";

import { UNSVoteBuilder, VoteTransaction } from "@uns/crypto";
import * as Fixtures from "../__fixtures__";

describe("Uns Vote register Transaction", () => {
    let builder;
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(VoteTransaction);

    beforeEach(() => {
        const senderPubKey = "03747096ce60f19e52e99f5d80ae1ddedf6fa88be4ff0669b33f75f3fd991cff28";
        builder = new UNSVoteBuilder().votesAsset([`+${senderPubKey}`]);
    });

    describe("should verify", () => {
        it("with a signature", () => {
            const transaction = builder.sign(Fixtures.ownerPassphrase);
            expect(transaction.build().verified).toBeTrue();
            expect(transaction.verify()).toBeTrue();
        });
        it("with second signature", () => {
            const transaction = builder.sign(Fixtures.ownerPassphrase).secondSign("second passphrase");
            expect(transaction.build().verified).toBeTrue();
            expect(transaction.verify()).toBeTrue();
        });
    });
});
