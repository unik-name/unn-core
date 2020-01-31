import { Managers, Transactions } from "@arkecosystem/crypto";
import { CertifiedNftMintTransaction } from "@uns/crypto/src";
import "jest-extended";
import * as Fixtures from "../__fixtures__";

describe("Uns Certified NFT Mint", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Transactions.TransactionRegistry.registerTransactionType(CertifiedNftMintTransaction);

    describe("should verify", () => {
        it("with a signature", () => {
            expect(Fixtures.unsCertifiedNftMintTransaction().build().verified).toBeTrue();
            expect(Fixtures.unsCertifiedNftMintTransaction().verify()).toBeTrue();
        });
        it("with second signature", () => {
            const transaction = Fixtures.unsCertifiedNftMintTransaction().secondSign("second passphrase");
            expect(transaction.build().verified).toBeTrue();
            expect(transaction.verify()).toBeTrue();
        });
    });
});
