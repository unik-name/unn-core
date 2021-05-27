import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { getCurrentNftAsset, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { NftOwnedError } from "../../errors";
import { INftWalletAttributes } from "../../interfaces";
import { NftsManager } from "../../manager";
import {
    addNftToWallet,
    applyNftMintDb,
    applyProperties,
    checkAssetPropertiesSize,
    removeNftFromWallet,
} from "./helpers";

export class NftMintTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return !Managers.configManager.getMilestone().certifiedNFTsOnly;
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
                const wallet: State.IWallet = walletManager.findById(transaction.senderPublicKey);
                const { tokenId, properties } = getCurrentNftAsset(transaction.asset);
                await addNftToWallet(wallet, walletManager, tokenId, parseInt(properties!.type));
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { tokenId, properties } = getCurrentNftAsset(transaction.data.asset);

        // check if token is already owned
        if (
            !!walletManager.allByAddress().find(wallet => {
                if (wallet.hasAttribute("tokens")) {
                    return Object.keys(wallet.getAttribute<INftWalletAttributes>("tokens")).includes(tokenId);
                }
                return false;
            })
        ) {
            throw new NftOwnedError(tokenId);
        }

        checkAssetPropertiesSize(properties);

        const nftManager = app.resolvePlugin<NftsManager>("core-nft");
        nftManager.constraints.applyGenesisPropertyConstraint(transaction.data);
        await nftManager.constraints.applyConstraints(transaction.data);
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
        const { senderPublicKey, asset } = transaction.data;
        const { tokenId, properties } = getCurrentNftAsset(asset);
        const wallet: State.IWallet = walletManager.findById(senderPublicKey);
        await addNftToWallet(wallet, walletManager, tokenId, parseInt(properties!.type));
        if (updateDb) {
            await applyNftMintDb(senderPublicKey, asset);
            await applyProperties(asset);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        const wallet: State.IWallet = walletManager.findById(transaction.data.senderPublicKey);
        await removeNftFromWallet(wallet, transaction.data.asset, walletManager);
        if (updateDb) {
            return app
                .resolvePlugin<NftsManager>("core-nft")
                .delete(getCurrentNftAsset(transaction.data.asset).tokenId);
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
}
