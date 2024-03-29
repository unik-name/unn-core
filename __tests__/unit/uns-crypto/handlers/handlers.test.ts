import "jest-extended";

import { Handlers } from "@arkecosystem/core-transactions";
import { Managers, Utils } from "@arkecosystem/crypto";
import { UNSDelegateRegisterBuilder, UnsTransactionGroup, UnsTransactionType } from "@uns/crypto";
import {
    CertifiedNftMintTransactionHandler,
    DelegateRegisterTransactionHandler,
    DiscloseExplicitTransactionHandler,
} from "@uns/uns-transactions";
import * as Fixtures from "../__fixtures__";
import { discloseExplicitTransaction } from "../helpers";

describe("Registry register uns transaction", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);

    Handlers.Registry.registerTransactionHandler(DiscloseExplicitTransactionHandler);
    Handlers.Registry.registerTransactionHandler(DelegateRegisterTransactionHandler);
    Handlers.Registry.registerTransactionHandler(CertifiedNftMintTransactionHandler);

    describe("Disclose Explicit", () => {
        it("should not throw when registering transactions", () => {
            return expect(
                Handlers.Registry.get(UnsTransactionType.UnsDiscloseExplicit, UnsTransactionGroup),
            ).resolves.toBeDefined();
        });

        it("should return dynamic fees", async () => {
            const handler = await Handlers.Registry.get(UnsTransactionType.UnsDiscloseExplicit, UnsTransactionGroup);
            const transaction = discloseExplicitTransaction().build();
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

    describe("Certified Nft Mint", () => {
        it("should not throw when registering transactions", () => {
            return expect(
                Handlers.Registry.get(UnsTransactionType.UnsCertifiedNftMint, UnsTransactionGroup),
            ).resolves.toBeDefined();
        });

        it("should return dynamic fees", async () => {
            const handler = await Handlers.Registry.get(UnsTransactionType.UnsCertifiedNftMint, UnsTransactionGroup);
            const transaction = Fixtures.unsCertifiedNftMintTransaction().build();
            expect(handler.dynamicFee({ addonBytes: 0, satoshiPerByte: 0, transaction } as any)).toEqual(
                Utils.BigNumber.make(264),
            );
        });

        it("should return zero after token eco v2 milestone", async () => {
            const handler = await Handlers.Registry.get(UnsTransactionType.UnsCertifiedNftMint, UnsTransactionGroup);
            Managers.configManager.getMilestone().unsTokenEcoV2 = true;
            const transaction = Fixtures.unsCertifiedNftMintTransaction().build();
            expect(handler.dynamicFee({ addonBytes: 0, satoshiPerByte: 0, transaction } as any)).toEqual(
                Utils.BigNumber.ZERO,
            );
        });
    });
});
