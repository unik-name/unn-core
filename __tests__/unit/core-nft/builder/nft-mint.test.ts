import "jest-extended";
import "../mocks/core-container";

import { Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { Builders, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "@uns/core-nft-crypto/src/enums";
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
            checkProperties(builder, "data");
        });

        it("should not have properties", () => {
            expect(builder).not.toHaveProperty("data.nft");
        });
    });

    describe("getAsset tests", () => {
        it("getAsset should be callable without calling sign()", () => {
            const result = builder.getCurrentAsset();
            expect(result).toStrictEqual({ nft: { [nftName]: { tokenId: nftId } } });
        });
    });
});

const checkProperties = (object: any, path?: string) => {
    expect(object).toHaveProperty(getPath("type", path), NftTransactionType.NftMint);
    expect(object).toHaveProperty(getPath("typeGroup", path), NftTransactionGroup);
    expect(object).toHaveProperty(getPath("amount", path), Utils.BigNumber.ZERO);
    expect(object).toHaveProperty(getPath("fee", path), Utils.BigNumber.make(NftTransactionStaticFees.NftMint));
    expect(object).toHaveProperty(getPath("recipientId", path), undefined);
    expect(object).toHaveProperty(getPath("senderPublicKey", path), undefined);
    expect(object).toHaveProperty(getPath("asset", path), { nft: { [nftName]: { tokenId: nftId } } });
    expect(object).toHaveProperty(getPath("version", path), 2);
    expect(object).toHaveProperty(getPath("nonce", path));
};

const getPath = (suffix: string, path?: string): string => {
    if (path) {
        return `${path}.${suffix}`;
    }
    return suffix;
};
