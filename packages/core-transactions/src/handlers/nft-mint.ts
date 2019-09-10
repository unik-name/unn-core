import { app } from "@arkecosystem/core-container";
import { Database, NFT, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, NFTMintTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
import { getCurrentNftAsset } from "@arkecosystem/crypto";
import { NftOwnedError } from "../errors";
import { TransactionHandler } from "./transaction";

export class NftMintTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return NFTMintTransaction;
    }

    public async canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): Promise<boolean> {
        const { tokenId, properties } = getCurrentNftAsset(transaction.data);
        if (walletManager.isTokenOwned(tokenId)) {
            throw new NftOwnedError(tokenId);
        }

        const nft = app.resolvePlugin<NFT.INFTManager>("nft");
        nft.checkGenesisProperties(properties);
        await nft.applyConstraints(transaction.data);

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.tokens = wallet.tokens.concat([getCurrentNftAsset(transaction.data).tokenId]);
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.tokens = wallet.tokens.filter(t => t !== getCurrentNftAsset(transaction.data).tokenId);
    }
    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }
}
