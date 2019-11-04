import { Database } from "@arkecosystem/core-interfaces";
import { IpfsTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class IpfsTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return IpfsTransaction;
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
