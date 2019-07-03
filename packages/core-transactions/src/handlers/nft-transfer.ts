import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    Address,
    ITransactionData,
    NFTTransferTransaction,
    Transaction,
    TransactionConstructor,
} from "@arkecosystem/crypto";
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

    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {
        const recipient = transaction.data.recipientId;
        const sender = Address.fromPublicKey(transaction.data.senderPublicKey);
        const isNftOwnershipTransfer = !!recipient;
        const data = {
            id: transaction.data.asset.nft.tokenId,
            owner: isNftOwnershipTransfer ? transaction.data.recipientId : sender,
            previousOwner: isNftOwnershipTransfer ? transaction.data.senderPublicKey : undefined,
        };
        emitter.emit(isNftOwnershipTransfer ? ApplicationEvents.NftTransferred : ApplicationEvents.NftCreated, data);
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
