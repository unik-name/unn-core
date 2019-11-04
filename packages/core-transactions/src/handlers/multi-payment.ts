import { Database } from "@arkecosystem/core-interfaces";
import { MultiPaymentTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class MultiPaymentTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return MultiPaymentTransaction;
    }

    public async canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): Promise<boolean> {
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public async apply(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        return;
    }

    public async revert(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        return;
    }
}
