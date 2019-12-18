import "jest-extended";

import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { UnsTransactionGroup, UnsTransactionType } from "@uns/crypto";
import { DiscloseExplicitTransactionHandler } from "@uns/uns-transactions";
import { NftMintTransactionHandler } from "../../../../packages/core-nft/src/transactions";
import * as Fixtures from "../__fixtures__";

describe("Registry register nft transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    beforeEach(() => {
        Handlers.Registry.registerTransactionHandler(DiscloseExplicitTransactionHandler);
        // TODO: uns : we must register nft-mint type because disclose explicit requires schema reference token id
        Handlers.Registry.registerTransactionHandler(NftMintTransactionHandler);
    });

    describe("nft-mint", () => {
        it("should not throw when registering transactions", () => {
            return expect(
                Handlers.Registry.get(UnsTransactionType.UnsDiscloseExplicit, UnsTransactionGroup),
            ).resolves.toBeDefined();
        });

        it("should return dynamic fees", async () => {
            const handler = await Handlers.Registry.get(UnsTransactionType.UnsDiscloseExplicit, UnsTransactionGroup);
            const transaction = Fixtures.discloseExplicitTransaction().build();
            expect(handler.dynamicFee({ addonBytes: 0, satoshiPerByte: 0, transaction } as any)).toEqual(
                Utils.BigNumber.make(221),
            );
        });
    });
});
