/* tslint:disable:ordered-imports*/
import "../mocks/core-container";

import { IBlock, Managers, Utils } from "@arkecosystem/crypto";
import { State } from "@arkecosystem/core-interfaces";
import { WalletManager } from "../../../../packages/core-state/src/wallets";

Managers.configManager.setFromPreset("dalinet");
const mintEventMilestone = Managers.configManager.getMilestones().find(milestone => !!milestone.mintEvent);

Managers.configManager.setHeight(mintEventMilestone.height - 1);

const mintEventBlock = ({
    data: {
        id: "7242383292164246617",
        version: 0,
        timestamp: 46583338,
        height: mintEventMilestone.height,
        reward: Utils.BigNumber.make("200000000"),
        previousBlock: "17882607875259085966",
        numberOfTransactions: 0,
        totalAmount: Utils.BigNumber.ZERO,
        totalFee: Utils.BigNumber.ZERO,
        payloadLength: 0,
        payloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        generatorPublicKey: "038082dad560a22ea003022015e3136b21ef1ffd9f2fd50049026cbe8e2258ca17",
        blockSignature:
            "304402204087bb1d2c82b9178b02b9b3f285de260cdf0778643064fe6c7aef27321d49520220594c57009c1fca543350126d277c6adeb674c00685a464c3e4bf0d634dc37e39",
        createdAt: "2018-09-11T16:48:58.431Z",
    },
    transactions: [],
} as any) as IBlock;

let walletManager: State.IWalletManager;

beforeEach(() => {
    walletManager = new WalletManager();
});

describe("apply/revert mint event block", () => {
    let delegateMock;
    let recipienWallet;
    const delegatePublicKey = mintEventBlock.data.generatorPublicKey;
    const mintRecipient = mintEventMilestone.mintEvent.recipientAddr;

    beforeEach(() => {
        delegateMock = {
            applyBlock: jest.fn(),
            revertBlock: jest.fn(),
            publicKey: delegatePublicKey,
            isDelegate: () => false,
            getAttribute: jest.fn(),
        };

        // @ts-ignore
        jest.spyOn(walletManager, "findByPublicKey").mockReturnValue(delegateMock);
        jest.spyOn(walletManager, "applyTransaction").mockImplementation();
        jest.spyOn(walletManager, "revertTransaction").mockImplementation();

        walletManager.reindex(delegateMock);

        recipienWallet = walletManager.findByAddress(mintRecipient);
    });

    it("should apply the block with mint event", async () => {
        expect(recipienWallet.balance).toEqual(Utils.BigNumber.ZERO);
        await walletManager.applyBlock(mintEventBlock);

        expect(delegateMock.applyBlock).toHaveBeenCalledWith(mintEventBlock.data);
        expect(+recipienWallet.balance).toEqual(mintEventMilestone.mintEvent.amount);
    });

    it("should apply the block with mint event", async () => {
        recipienWallet.balance = Utils.BigNumber.make(mintEventMilestone.mintEvent.amount);
        await walletManager.revertBlock(mintEventBlock);

        expect(delegateMock.revertBlock).toHaveBeenCalledWith(mintEventBlock.data);
        expect(recipienWallet.balance).toEqual(Utils.BigNumber.ZERO);
    });
});
