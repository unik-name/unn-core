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
            if (!wallet.tokens.includes(data.asset.nft.tokenId)) {
                throw new NftOwnerError(wallet.publicKey, data.asset.nft.tokenId);
            }
        } else if (walletManager.isTokenOwned(data.asset.nft.tokenId)) {
            throw new NftOwnedError(data.asset.nft.tokenId);
        }
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public applyToRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        this.addTokenToWallet(wallet, transaction.data.asset.nft.tokenId);
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
            this.addTokenToWallet(wallet, data.asset.nft.tokenId);
        }
    }

    /**
     * Revert the transaction from the sender wallet.
     */
    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.recipientId) {
            this.addTokenToWallet(wallet, data.asset.nft.tokenId);
        } else {
            // it was a token mint
            this.removeTokenFromWallet(wallet, data);
        }
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }

    private removeTokenFromWallet(wallet: Database.IWallet, transaction: ITransactionData): void {
        const transferredTokenIndex = wallet.tokens.indexOf(transaction.asset.nft.tokenId);
        if (transferredTokenIndex === -1) {
            throw new Error(`wallet ${wallet.address} does not own token`);
        }
        const copy = wallet.tokens.slice();
        copy.splice(transferredTokenIndex, 1);
        wallet.tokens = copy;
    }
    private addTokenToWallet(wallet: Database.IWallet, tokenId: string): void {
        const copy = wallet.tokens.slice();
        copy.push(tokenId);
        wallet.tokens = copy;
    }
}
