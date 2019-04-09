import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, NFTTransferTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { NftOwnedError, NftOwnerError } from "../errors";

import { TransactionHandler } from "./transaction";

export class NftTransferTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return NFTTransferTransaction;
    }

    public canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): boolean {
        const { data } = transaction;

        if (data.recipientId) {
            if (!wallet.tokens.find(tokenId => tokenId.isEqualTo(data.asset.nft.tokenId))) {
                throw new NftOwnerError(wallet.publicKey, data.asset.nft.tokenId.toString());
            }
        } else if (walletManager.isTokenOwned(data.asset.nft.tokenId)) {
            throw new NftOwnedError(data.asset.nft.tokenId.toString());
        }
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public applyToRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.tokens.push(transaction.data.asset.nft.tokenId);
    }

    public revertForRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        this.removeTokenFromWallet(wallet, transaction.data);
    }

    /**
     * Apply the transaction to the sender wallet.
     */
    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.recipientId) {
            this.removeTokenFromWallet(wallet, data);
        } else {
            if (!wallet.tokens.find(token => token.isEqualTo(data.asset.nft.tokenId))) {
                /* TODO: remove condition
                 * Condition is used because `apply` function is called twice (by transaction-pool and block processor)
                 * without condition, token id is pushed twice in wallet
                 * Issue is that `transaction-pool` and `block-processor` should not execute `apply` on the same wallet.
                 * I couldn't find why it does.
                 */
                wallet.tokens.push(data.asset.nft.tokenId);
            }
        }
    }

    /**
     * Revert the transaction from the sender wallet.
     */
    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.recipientId) {
            // get token back to the previous owner
            if (!wallet.tokens.find(token => token.isEqualTo(data.asset.nft.tokenId))) {
                /* TODO: remove condition
                 * Condition is used because `apply` function is called twice (by transaction-pool and block processor)
                 * without condition, token id is pushed twice in wallet
                 * Issue is that `transaction-pool` and `block-processor` should not execute `apply` on the same wallet.
                 * I couldn't find why it does.
                 */
                wallet.tokens.push(data.asset.nft.tokenId);
            }
        } else {
            // it was a token mint
            this.removeTokenFromWallet(wallet, data);
        }
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }

    private removeTokenFromWallet(wallet: Database.IWallet, transaction: ITransactionData): void {
        const transferredTokenIndex = wallet.tokens.findIndex(tokenId => tokenId === transaction.asset.nft.tokenId);
        wallet.tokens.splice(transferredTokenIndex, 1);
    }
}
