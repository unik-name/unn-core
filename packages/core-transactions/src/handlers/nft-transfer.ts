import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, NFTTransferTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { getCurrentNftAsset } from "@arkecosystem/crypto";
import { NftOwnerError } from "../errors";
import { TransactionHandler } from "./transaction";

export class NftTransferTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return NFTTransferTransaction;
    }

    public async canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): Promise<boolean> {
        const tokenId = getCurrentNftAsset(transaction.data).tokenId;
        if (!wallet.tokens.includes(tokenId)) {
            throw new NftOwnerError(wallet.publicKey, tokenId);
        }

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public applyToRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        this.addTokenToWallet(wallet, getCurrentNftAsset(transaction.data).tokenId);
    }

    public revertForRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        this.removeTokenFromWallet(wallet, transaction.data);
    }

    /**
     * Apply the transaction to the sender wallet.
     */
    public async apply(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        this.removeTokenFromWallet(wallet, transaction.data);
    }

    /**
     * Revert the transaction from the sender wallet.
     */
    public async revert(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        this.addTokenToWallet(wallet, getCurrentNftAsset(transaction.data).tokenId);
    }

    public async canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): Promise<boolean> {
        return !(await this.typeFromSenderAlreadyInPool(data, guard));
    }

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(ApplicationEvents.NftTransferred, {
            id: transaction.data.asset.nft.tokenId,
            owner: transaction.data.recipientId,
            previousOwner: transaction.data.senderPublicKey,
        });
    }

    private removeTokenFromWallet(wallet: Database.IWallet, transaction: ITransactionData): void {
        if (!wallet.tokens.includes(getCurrentNftAsset(transaction).tokenId)) {
            throw new NftOwnerError(wallet.address, getCurrentNftAsset(transaction).tokenId); // TODO change message ?
        }
        wallet.tokens = wallet.tokens.filter(t => t !== getCurrentNftAsset(transaction).tokenId);
    }
    private addTokenToWallet(wallet: Database.IWallet, tokenId: string): void {
        wallet.tokens = wallet.tokens.concat([tokenId]);
    }
}
