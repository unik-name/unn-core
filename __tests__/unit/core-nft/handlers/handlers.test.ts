import "jest-extended";

import { Handlers } from "../../../../packages/core-transactions";
import { Managers, Utils } from "../../../../packages/crypto";

import { Builders, Enums } from "@uns/core-nft-crypto";
import {
    NftMintTransactionHandler,
    NftTransferTransactionHandler,
    NftUpdateTransactionHandler,
} from "@uns/core-nft/src/transactions/";
import { network, nftId, nftName, recipient } from "../__fixtures__";

describe("Registry register nft transaction", () => {
    Managers.configManager.setFromPreset(network);
    Managers.configManager.setHeight(2);

    beforeEach(() => {
        Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);
        Handlers.Registry.registerTransactionHandler(NftUpdateTransactionHandler);
        Handlers.Registry.registerTransactionHandler(NftTransferTransactionHandler);
    });

    describe("nft-mint", () => {
        it("should not throw when registering transactions", () => {
            return expect(
                Handlers.Registry.get(Enums.NftTransactionType.NftMint, Enums.NftTransactionGroup),
            ).resolves.toBeDefined();
        });

        it("should return dynamic fees", async () => {
            const handler = await Handlers.Registry.get(Enums.NftTransactionType.NftMint, Enums.NftTransactionGroup);
            const transaction = new Builders.NftMintBuilder(nftName, nftId).sign("passphrase").build();
            expect(handler.dynamicFee({ transaction, satoshiPerByte: 0 } as any)).toEqual(Utils.BigNumber.make(81));
        });
    });

    describe("nft-update", () => {
        it("should not throw when registering transactions", () => {
            return expect(
                Handlers.Registry.get(Enums.NftTransactionType.NftUpdate, Enums.NftTransactionGroup),
            ).resolves.not.toThrow();
        });

        it("should return dynamic fees", async () => {
            const handler = await Handlers.Registry.get(Enums.NftTransactionType.NftUpdate, Enums.NftTransactionGroup);
            const transaction = new Builders.NftUpdateBuilder(nftName, nftId)
                .properties({ foo: "true" })
                .sign("passphrase")
                .build();
            expect(handler.dynamicFee({ transaction, satoshiPerByte: 0 } as any)).toEqual(Utils.BigNumber.make(86));
        });
    });

    describe("nft-transfer", () => {
        it("should not throw when registering transactions", () => {
            return expect(
                Handlers.Registry.get(Enums.NftTransactionType.NftTransfer, Enums.NftTransactionGroup),
            ).resolves.toBeDefined();
        });

        it("should return dynamic fees", async () => {
            const handler = await Handlers.Registry.get(
                Enums.NftTransactionType.NftTransfer,
                Enums.NftTransactionGroup,
            );
            const transaction = new Builders.NftTransferBuilder(nftName, nftId)
                .recipientId(recipient)
                .sign("passphrase")
                .build();
            expect(handler.dynamicFee({ transaction, satoshiPerByte: 0 } as any)).toEqual(Utils.BigNumber.make(92));
        });
    });
});
