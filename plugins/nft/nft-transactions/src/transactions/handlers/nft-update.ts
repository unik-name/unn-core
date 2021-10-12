import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, Interfaces as TrxInterfaces, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { getCurrentNftAsset, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { NftOwnerError } from "../../errors";
import { INftWalletAttributes } from "../../interfaces";
import { NftsManager } from "../../manager";
import { applyProperties, checkAssetPropertiesSize, revertProperties } from "./helpers";

export class NftUpdateTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return this.isTransactionActivated();
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return NftTransactions.NftUpdateTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [
            require("@uns/uns-transactions/dist/handlers/uns-certified-nft-mint").CertifiedNftMintTransactionHandler,
        ];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(
        connection: Database.IConnection,
        _: State.IWalletManager,
        options: TrxInterfaces.IBootstrapOptions,
    ): Promise<void> {
        if (options.buildNftPropertiesTable) {
            const reader: TransactionReader = await TransactionReader.create(connection, this.getConstructor());
            while (reader.hasNext()) {
                const transactions = await reader.read();
                for (const transaction of transactions) {
                    const asset = getCurrentNftAsset(transaction.asset);
                    if (asset.properties) {
                        const nftManager = app.resolvePlugin<NftsManager>("core-nft");
                        await nftManager.manageProperties(asset.properties, asset.tokenId);
                    }
                }
            }
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const { tokenId, properties } = getCurrentNftAsset(transaction.data.asset);

        // check if sender owns token
        if (
            !wallet.hasAttribute("tokens") ||
            !Object.keys(wallet.getAttribute<INftWalletAttributes>("tokens")).includes(tokenId)
        ) {
            throw new NftOwnerError(wallet, tokenId);
        }

        checkAssetPropertiesSize(properties);

        await app.resolvePlugin<NftsManager>("core-nft").constraints.applyConstraints(transaction.data);
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
        if (updateDb) {
            await applyProperties(transaction.data.asset);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        if (updateDb) {
            await revertProperties(transaction.data);
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
