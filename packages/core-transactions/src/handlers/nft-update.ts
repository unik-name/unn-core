import { app } from "@arkecosystem/core-container";
import { Database, NFT, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, NFTUpdateTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { getCurrentNftAsset } from "@arkecosystem/crypto";
import { NftOwnerError } from "../errors";
import { TransactionHandler } from "./transaction";

export class NftUpdateTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return NFTUpdateTransaction;
    }

    /**
     * Check if the transaction can be applied to the wallet.
     */
    public async canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): Promise<boolean> {
        if (!wallet.tokens.includes(getCurrentNftAsset(transaction.data).tokenId)) {
            throw new NftOwnerError(wallet.address, getCurrentNftAsset(transaction.data).tokenId);
        }

        await app.resolvePlugin<NFT.INFTManager>("nft").applyConstraints(transaction.data);

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    /**
     * Apply the transaction to the wallet.
     */
    public async apply(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        // action delegated to the nft manager
        // TODO:
    }

    /**
     * Revert the transaction from the wallet.
     */
    public async revert(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        // cannot get back property value...
        // TODO:
    }
    public async canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): Promise<boolean> {
        return !(await this.typeFromSenderAlreadyInPool(data, guard));
    }
}
