import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, NFTTransferTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
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
        const tokenId = transaction.data.asset.nft.tokenId;
        if (!wallet.tokens.includes(tokenId)) {
            throw new NftOwnerError(wallet.publicKey, tokenId);
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
        this.removeTokenFromWallet(wallet, transaction.data);
    }

    /**
     * Revert the transaction from the sender wallet.
     */
    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        this.addTokenToWallet(wallet, transaction.data.asset.nft.tokenId);
    }

    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(ApplicationEvents.NftTransferred, {
            id: transaction.data.asset.nft.tokenId,
            owner: transaction.data.recipientId,
            previousOwner: transaction.data.senderPublicKey,
        });
    }

    private removeTokenFromWallet(wallet: Database.IWallet, transaction: ITransactionData): void {
        if (!wallet.tokens.includes(transaction.asset.nft.tokenId)) {
            throw new NftOwnerError(wallet.address, transaction.asset.nft.tokenId); // TODO change message ?
        }
        wallet.tokens = wallet.tokens.filter(t => t !== transaction.asset.nft.tokenId);
    }
    private addTokenToWallet(wallet: Database.IWallet, tokenId: string): void {
        wallet.tokens = wallet.tokens.concat([tokenId]);
    }
}
