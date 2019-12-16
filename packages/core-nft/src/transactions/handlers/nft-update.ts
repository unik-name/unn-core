import { app } from "@arkecosystem/core-container";
import { Database, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { Enums, getCurrentNftAsset, getNftName, Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { NftOwnerError } from "../../errors";
import { INftWalletAttributes } from "../../interfaces";
import { NftsManager } from "../../manager";
import { checkAssetPropertiesSize, revertProperties } from "./helpers";
import { NftMintTransactionHandler } from "./nft-mint";

export class NftUpdateTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return true;
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return NftTransactions.NftUpdateTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NftMintTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        // nothing to do because we don't update wallet state
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
            !wallet.getAttribute<INftWalletAttributes>("tokens").tokens.includes(tokenId)
        ) {
            throw new NftOwnerError(tokenId);
        }

        checkAssetPropertiesSize(properties);

        await app.resolvePlugin<NftsManager>("core-nft").constraints.applyConstraints(transaction.data);
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        return !(await this.typeFromSenderAlreadyInPool(data, pool, processor));
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);
        if (updateDb) {
            const assets = getCurrentNftAsset(transaction.data.asset);

            if (assets.properties) {
                return app.resolvePlugin<NftsManager>("core-nft").manageProperties(assets.properties, assets.tokenId);
            }
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        if (updateDb) {
            const { tokenId } = getCurrentNftAsset(transaction.data.asset);
            const nftName: string = getNftName(transaction.data.asset);
            const asset = { nft: { [nftName]: { tokenId } } };
            const types = [Enums.NftTransactionType.NftMint, transaction.type];
            await revertProperties(
                transaction.data,
                tokenId,
                asset,
                types,
                tx => getCurrentNftAsset(tx.asset).properties,
            );
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
