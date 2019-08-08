import { app } from "@arkecosystem/core-container";
import { Database, NFT, TransactionPool } from "@arkecosystem/core-interfaces";
import { ITransactionData, NFTMintTransaction, Transaction, TransactionConstructor } from "@arkecosystem/crypto";
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
        if (walletManager.isTokenOwned(transaction.data.asset.nft.tokenId)) {
            throw new NftOwnedError(transaction.data.asset.nft.tokenId);
        }

        await app.resolvePlugin<NFT.INFTManager>("nft").applyConstraints(transaction.data);

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public apply(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.tokens = wallet.tokens.concat([transaction.data.asset.nft.tokenId]);
    }

    public revert(transaction: Transaction, wallet: Database.IWallet): void {
        wallet.tokens = wallet.tokens.filter(t => t !== transaction.data.asset.nft.tokenId);
    }
    public canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): boolean {
        return !this.typeFromSenderAlreadyInPool(data, guard);
    }
}
