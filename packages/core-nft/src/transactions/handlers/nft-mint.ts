import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { NftTransactions, NftTransactionType, NftTransactionGroup, getCurrentNftAsset } from "@uns/core-nft-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Identities } from "@arkecosystem/crypto";
import { NftTransactionHandler } from "./nft-handler";
import { INftWalletAttributes } from "../../interfaces";
import { NftOwnedError } from "../errors";
import { NftApplicationEvents } from "../events";

export class NftMintTransactionHandler extends NftTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return NftTransactions.NFTMintTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return ["tokens"];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const wallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                const attributes = wallet.getAttribute<INftWalletAttributes>("tokens");
                wallet.setAttribute("tokens", attributes.tokens.concat([getCurrentNftAsset(transaction).tokenId]));
                walletManager.reindex(wallet);
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { tokenId } = getCurrentNftAsset(transaction.data);
        //check if token is already owned
        if (!!walletManager.allByAddress().find(wallet => wallet.getAttribute("tokens").tokens.includes(tokenId))) {
            throw new NftOwnedError(tokenId);
        }

        const nftManager = app.resolvePlugin("core-nft");
        nftManager.constraints.applyGenesisPropertyConstraint(transaction.data);
        await nftManager.constraints.applyConstraints(transaction.data);
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(NftApplicationEvents.NftMinted, transaction.data);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (
            await pool.senderHasTransactionsOfType(
                data.senderPublicKey,
                NftTransactionType.NftMint,
                NftTransactionGroup,
            )
        ) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `Nft mint for wallet "${data.senderPublicKey}" already in the pool`,
            );
            return false;
        }

        return true;
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);

        const { tokenId, properties } = getCurrentNftAsset(transaction.data);

        const wallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const attributes = wallet.getAttribute<INftWalletAttributes>("tokens");
        wallet.setAttribute<INftWalletAttributes>("tokens", {
            tokens: attributes.tokens.concat([tokenId]),
        });
        walletManager.reindex(wallet);

        const sender = Identities.Address.fromPublicKey(transaction.data.senderPublicKey);

        const nftManager = app.resolvePlugin("core-nft");
        await nftManager.insert(tokenId, sender);

        if (properties) {
            await Promise.all(
                Object.entries(properties).map(async ([key, value]) => nftManager.insertProperty(key, value, tokenId)),
            );
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const { tokenId } = getCurrentNftAsset(transaction.data);

        const wallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const attributes = wallet.getAttribute<INftWalletAttributes>("tokens");

        wallet.setAttribute<INftWalletAttributes>("tokens", {
            tokens: attributes.tokens.filter(t => t !== tokenId),
        });
        walletManager.reindex(wallet);

        const nftManager = app.resolvePlugin("nft");
        return nftManager.delete(tokenId);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}
}
