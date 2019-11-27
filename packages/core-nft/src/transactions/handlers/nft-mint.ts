import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Identities, Interfaces, Transactions } from "@arkecosystem/crypto";
import { getCurrentNftAsset, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { INftWalletAttributes } from "../../interfaces";
import { NftsManager } from "../../manager";
import { NftOwnedError, NftPropertyTooLongError } from "../../errors"

export class NftMintTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return true;
    }

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
        const { tokenId, properties } = getCurrentNftAsset(transaction.data.asset);

        this.checkAssetPropertiesSize(properties);

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
            return this.applyNftMintDb(transaction.data);
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

        if (attributes.tokens.length > 1) {
            wallet.setAttribute<INftWalletAttributes>("tokens", {
                tokens: attributes.tokens.filter(t => t !== tokenId),
            });
        } else {
            wallet.forgetAttribute("tokens");
        }
        walletManager.reindex(wallet);

        if (updateDb) {
            return app.resolvePlugin<NftsManager>("core-nft").delete(tokenId);
        }
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
        const senderAddr = Identities.Address.fromPublicKey(transactionData.senderPublicKey);
        const nftManager = app.resolvePlugin<NftsManager>("core-nft");
        await nftManager.insert(tokenId, senderAddr);

        if (properties) {
            return nftManager.insertProperties(properties, tokenId);
        }
    }

    protected checkAssetPropertiesSize(properties) {
        for (const propertyKey in properties) {
            if (properties.hasOwnProperty(propertyKey)) {
                const value = properties[propertyKey];
                if (value && Buffer.from(value, "utf8").length > 255) {
                    throw new NftPropertyTooLongError(propertyKey);
                }
            }
        }
    }
}
