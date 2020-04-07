import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { getCurrentNftAsset, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { NftOwnerError } from "../../errors";
import { INftWalletAttributes } from "../../interfaces";
import { addNftToWallet, applyNftTransferDb, removeNftFromWallet } from "./helpers";

export class NftTransferTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return this.isTransactionActivated();
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return NftTransactions.NftTransferTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        // get certifiedNftMint Handler
        return [
            require("@uns/uns-transactions/dist/handlers/uns-certified-nft-mint").CertifiedNftMintTransactionHandler,
        ];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const { asset, senderPublicKey, recipientId } = transaction;
                const senderWallet: State.IWallet = walletManager.findById(senderPublicKey);
                await removeNftFromWallet(senderWallet, asset, walletManager);
                const recipientWallet: State.IWallet = walletManager.findByAddress(recipientId);
                await addNftToWallet(recipientWallet, asset, walletManager);
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { tokenId } = getCurrentNftAsset(transaction.data.asset);

        // check if sender owns token
        if (
            !wallet.hasAttribute("tokens") ||
            !wallet.getAttribute<INftWalletAttributes>("tokens").tokens.includes(tokenId)
        ) {
            throw new NftOwnerError(wallet, tokenId);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);
        const { senderPublicKey, asset, recipientId } = transaction.data;
        const wallet: State.IWallet = walletManager.findById(senderPublicKey);
        await removeNftFromWallet(wallet, asset, walletManager);
        if (updateDb) {
            return applyNftTransferDb(recipientId, asset);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        const { senderPublicKey, asset } = transaction.data;
        const wallet: State.IWallet = walletManager.findById(senderPublicKey);
        await addNftToWallet(wallet, asset, walletManager);
        if (updateDb) {
            return applyNftTransferDb(wallet.address, asset);
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {
        const { asset, recipientId } = transaction.data;
        const wallet: State.IWallet = walletManager.findByAddress(recipientId);
        await addNftToWallet(wallet, asset, walletManager);
        // db update is done in applyToSender method
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {
        const { asset, recipientId } = transaction.data;
        const wallet: State.IWallet = walletManager.findByAddress(recipientId);
        await removeNftFromWallet(wallet, asset, walletManager);
    }
}
