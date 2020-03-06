import { State } from "@arkecosystem/core-interfaces";
import { TransactionHandlerConstructor } from "@arkecosystem/core-transactions/dist/handlers";
import { DelegateResignationTransactionHandler } from "@arkecosystem/core-transactions/dist/handlers/delegate-resignation";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { DelegateResignTransaction } from "@uns/crypto";
import { CryptoAccountNotADelegateError } from "../errors";
import { DELEGATE_BADGE, DelegateRegisterTransactionHandler } from "./uns-delegate-register";
import { getNftsManager } from "./utils/helpers";

export class DelegateResignTransactionHandler extends DelegateResignationTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return DelegateResignTransaction;
    }

    public async isActivated(): Promise<boolean> {
        return Managers.configManager.getMilestone().aip11 === true;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [DelegateRegisterTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        if (!wallet.hasAttribute("delegate.username")) {
            throw new CryptoAccountNotADelegateError();
        }
        const nftId: string = wallet.getAttribute("delegate.username");

        // check delegate badge
        const badge = await getNftsManager().getProperty(nftId, DELEGATE_BADGE);
        if (badge?.value !== "true") {
            throw new CryptoAccountNotADelegateError();
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);
        if (updateDb) {
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            const nftId: string = sender.getAttribute("delegate.username");
            await getNftsManager().manageProperties({ [DELEGATE_BADGE]: "false" }, nftId);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        if (updateDb) {
            const sender: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
            const nftId: string = sender.getAttribute("delegate.username");
            await getNftsManager().manageProperties({ [DELEGATE_BADGE]: "true" }, nftId);
        }
    }
}
