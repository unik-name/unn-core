import "jest-extended";

import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";

import { NftBuilders } from "@uns/core-nft-crypto";
import { NftTransactionGroup, NftTransactionType } from "@uns/core-nft-crypto/src/enums";
import { NftMintTransactionHandler } from "../../../../packages/core-nft/src/transactions/";

const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

describe("Registry test", () => {
    Managers.configManager.setFromPreset("testnet");

    it("should not throw when registering nftMint transactions", () => {
        Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);

        expect(async () => {
            await Handlers.Registry.get(NftTransactionType.NftMint, NftTransactionGroup);
        }).not.toThrowError();
    });

    it("should return nftMint dynamic fees", () => {
        for (const handler of Handlers.Registry.getAll().filter(
            handler =>
                handler.getConstructor().typeGroup === NftTransactionGroup &&
                handler.getConstructor().type === NftTransactionType.NftMint,
        )) {
            const addonBytes = 666;
            const transaction = new NftBuilders.NftMintBuilder("myNft", TOKEN_ID)
                .nonce("1")
                .sign("clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire")
                .build();

            expect(handler.dynamicFee({ transaction, addonBytes, satoshiPerByte: 3, height: 1 })).toEqual(
                Utils.BigNumber.make(addonBytes + transaction.serialized.length / 2).times(3),
            );
        }
    });
});
