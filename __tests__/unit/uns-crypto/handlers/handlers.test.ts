import "jest-extended";

import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { UNSDelegateRegisterBuilder, UnsTransactionGroup, UnsTransactionType } from "@uns/crypto";
import { DelegateRegisterTransactionHandler, DiscloseExplicitTransactionHandler } from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";

describe("Registry register uns transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(DiscloseExplicitTransactionHandler);
    Handlers.Registry.registerTransactionHandler(DelegateRegisterTransactionHandler);

    describe("Disclose Explicit", () => {
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
    describe("Delegate register", () => {
        it("should not throw when registering transactions", () => {
            return expect(
                Handlers.Registry.get(UnsTransactionType.UnsDelegateRegister, UnsTransactionGroup),
            ).resolves.toBeDefined();
        });

        it("should return dynamic fees", async () => {
            const handler = await Handlers.Registry.get(UnsTransactionType.UnsDelegateRegister, UnsTransactionGroup);
            const transaction = new UNSDelegateRegisterBuilder()
                .usernameAsset(Fixtures.tokenId)
                .sign(Fixtures.ownerPassphrase)
                .build();
            expect(handler.dynamicFee({ addonBytes: 0, satoshiPerByte: 0, transaction } as any)).toEqual(
                Utils.BigNumber.make(94),
            );
        });
    });
});
