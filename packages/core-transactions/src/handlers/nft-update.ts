import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, NFTUpdateTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { TransactionHandler } from "./transaction";

export class NftUpdateTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return NFTUpdateTransaction;
    }

    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        return (
            wallet.tokens.includes(transaction.data.asset.nft.tokenId) &&
            super.canBeApplied(transaction, wallet, walletManager)
        );
    }

    /**
     * Apply the transaction to the wallet.
     */
    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        // action delegated to the nft manager
        // TODO:
    }

    /**
     * Revert the transaction from the wallet.
     */
    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        // cannot get back property value...
        // TODO:
    }
    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }
}
