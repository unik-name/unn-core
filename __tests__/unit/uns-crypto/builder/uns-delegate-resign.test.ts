import { Managers, Transactions, Utils } from "@arkecosystem/crypto";

import {
    DelegateResignTransaction,
    UNSDelegateResignBuilder,
    UnsTransactionGroup,
    UnsTransactionStaticFees,
    UnsTransactionType,
} from "@uns/crypto";
import * as Fixtures from "../__fixtures__";

describe("Uns Delegate resign Transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    let builder: UNSDelegateResignBuilder;

    Transactions.TransactionRegistry.registerTransactionType(DelegateResignTransaction);

    beforeEach(() => {
        builder = new UNSDelegateResignBuilder();
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

    describe("should have properties", () => {
        it("specific", () => {
            expect(builder).toHaveProperty("data.type", UnsTransactionType.UnsDelegateResign);
            expect(builder).toHaveProperty("data.typeGroup", UnsTransactionGroup);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty(
                "data.fee",
                Utils.BigNumber.make(UnsTransactionStaticFees.UnsDelegateResign),
            );
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.version", 2);
        });
        it("should not have the username yet", () => {
            expect(builder).not.toHaveProperty("data.username");
        });
    });
});
