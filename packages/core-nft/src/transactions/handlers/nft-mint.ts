import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Identities, Interfaces, Transactions } from "@arkecosystem/crypto";
import { getCurrentNftAsset, NftTransactions } from "@uns/core-nft-crypto";
import { NftOwnedError } from "../../errors";
import { INftWalletAttributes } from "../../interfaces";
import { NftsManager } from "../../manager";
import { NftTransactionHandler } from "./nft-handler";

export class NftMintTransactionHandler extends NftTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return NftTransactions.NftMintTransaction;
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
                await this.applyNftMintWalletState(transaction, walletManager);
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { tokenId } = getCurrentNftAsset(transaction.data.asset);

        // check if token is already owned
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
        nftManager.constraints.applyGenesisPropertyConstraint(transaction.data);
        await nftManager.constraints.applyConstraints(transaction.data);
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (await this.typeFromSenderAlreadyInPool(data, pool, processor)) {
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
        await this.applyNftMintWalletState(transaction.data, walletManager);
        if (updateDb) {
            await this.applyNftMintDb(transaction.data);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const { tokenId } = getCurrentNftAsset(transaction.data.asset);

        const wallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const attributes = wallet.getAttribute<INftWalletAttributes>("tokens");

        wallet.setAttribute<INftWalletAttributes>("tokens", {
            tokens: attributes.tokens.filter(t => t !== tokenId),
        });
        walletManager.reindex(wallet);

        if (updateDb) {
            await app.resolvePlugin<NftsManager>("core-nft").delete(tokenId);
        }
    }

    private async applyNftMintWalletState(
        transactionData: Interfaces.ITransactionData | Database.IBootstrapTransaction,
        walletManager: State.IWalletManager,
    ) {
        const { tokenId } = getCurrentNftAsset(transactionData.asset);

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
        transactionData: Interfaces.ITransactionData | Database.IBootstrapTransaction,
    ): Promise<void> {
        const { tokenId, properties } = getCurrentNftAsset(transactionData.asset);
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
