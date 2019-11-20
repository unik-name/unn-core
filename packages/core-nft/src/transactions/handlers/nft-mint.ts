import { app } from "@arkecosystem/core-container";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { NftTransactions, NftTransactionType, NftTransactionGroup, getCurrentNftAsset } from "@uns/core-nft-crypto";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions, Identities } from "@arkecosystem/crypto";
import { NftTransactionHandler } from "./nft-handler";
import { INftWalletAttributes } from "../../interfaces";
import { NftOwnedError } from "../errors";
import { NftApplicationEvents } from "../events";
import { NftsManager } from "../../manager";

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
                this.applyNftMintWalletState(transaction, walletManager);
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
        if (
            wallet.hasAttribute("tokens") &&
            !!walletManager.allByAddress().find(wallet => {
                if (wallet.hasAttribute("tokens")) {
                    return wallet.getAttribute<INftWalletAttributes>("tokens").tokens.includes(tokenId);
                }
                return false;
            })
        ) {
            throw new NftOwnedError(tokenId);
        }

        const nftManager = app.resolvePlugin<NftsManager>("core-nft");

        await nftManager.constraints.applyGenesisPropertyConstraint(transaction.data);

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
        updateDb = false,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);
        this.applyNftMintWalletState(transaction.data, walletManager);
        if (updateDb)
          this.applyNftMintDb(transaction.data);
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

        const nftManager = app.resolvePlugin<NftsManager>("core-nft");
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

    private async applyNftMintWalletState(
        transactionData: Interfaces.ITransactionData | Database.IBootstrapTransaction,
        walletManager: State.IWalletManager,
    ) {
        const { tokenId } = getCurrentNftAsset(transactionData);

        const wallet: State.IWallet = walletManager.findByPublicKey(transactionData.senderPublicKey);
        let attributes: INftWalletAttributes = { tokens: [] };
        if (wallet.hasAttribute("tokens")) {
            attributes = wallet.getAttribute<INftWalletAttributes>("tokens");
        }

        wallet.setAttribute<INftWalletAttributes>("tokens", {
            tokens: attributes.tokens.concat([tokenId]),
        });
        walletManager.reindex(wallet);
    }

    private async applyNftMintDb(
        transactionData: Interfaces.ITransactionData | Database.IBootstrapTransaction,
    ): Promise<void> {
        const { tokenId, properties } = getCurrentNftAsset(transactionData);
        const nftManager = app.resolvePlugin("core-nft");
        const senderAddr = Identities.Address.fromPublicKey(transactionData.senderPublicKey);
        await nftManager.insert(tokenId, senderAddr);

        if (properties) {
            await Promise.all(
                Object.entries(properties).map(async ([key, value]) => nftManager.insertProperty(key, value, tokenId)),
            );
        }

    }
}
