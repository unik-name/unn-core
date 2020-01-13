import { Managers, Transactions, Utils } from "@arkecosystem/crypto";

import {
    DelegateRegisterTransaction,
    UNSDelegateRegisterBuilder,
    UnsTransactionGroup,
    UnsTransactionStaticFees,
    UnsTransactionType,
} from "@uns/crypto";
import * as Fixtures from "../__fixtures__";

describe("Uns Delegate register Transaction", () => {
    let builder;
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(DelegateRegisterTransaction);

    beforeEach(() => {
        builder = new UNSDelegateRegisterBuilder().usernameAsset(Fixtures.tokenId);
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
            expect(builder).toHaveProperty("data.type", UnsTransactionType.UnsDelegateRegister);
            expect(builder).toHaveProperty("data.typeGroup", UnsTransactionGroup);
            expect(builder).toHaveProperty("data.amount", Utils.BigNumber.ZERO);
            expect(builder).toHaveProperty(
                "data.fee",
                Utils.BigNumber.make(UnsTransactionStaticFees.UnsDelegateRegister),
            );
            expect(builder).toHaveProperty("data.recipientId", undefined);
            expect(builder).toHaveProperty("data.version", 2);
            expect(builder).toHaveProperty("data.asset.delegate.username", Fixtures.tokenId);
        });
    });
});
