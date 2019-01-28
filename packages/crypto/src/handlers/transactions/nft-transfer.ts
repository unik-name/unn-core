import { ITransactionData, Wallet } from "../../models";
import { Handler } from "./handler";

export class NftTransferHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        if (transaction.recipientId) {
            const transferredTokenId = transaction.asset.nft.tokenId;

            // only the token owner can transfer
            if (!wallet.tokens.find(tokenId => tokenId.isEqualTo(transferredTokenId))) {
                errors.push(`wallet ${wallet.publicKey} is not the owner of token '${transferredTokenId}'`);
                return false;
            }
        }

        // it's token minting and condition is verified in wallet manager
        return true;
    }

    public applyTransactionToRecipient(wallet: Wallet, transaction: ITransactionData): void {
        super.applyTransactionToRecipient(wallet, transaction);
        wallet.tokens.push(transaction.asset.nft.tokenId);
    }

    public revertTransactionForRecipient(wallet: Wallet, transaction: ITransactionData): void {
        super.revertTransactionForRecipient(wallet, transaction);
        this.removeTokenFromWallet(wallet, transaction);
    }

    /**
     * Apply the transaction to the sender wallet.
     */
    protected apply(wallet: Wallet, transaction: ITransactionData): void {
        if (transaction.recipientId) {
            this.removeTokenFromWallet(wallet, transaction);
        } else {
            if (!wallet.tokens.find(token => token.isEqualTo(transaction.asset.nft.tokenId))) {
                /* TODO: remove condition
                 * Condition is used because `apply` function is called twice (by transaction-pool and block processor)
                 * without condition, token id is pushed twice in wallet
                 * Issue is that `transaction-pool` and `block-processor` should not execute `apply` on the same wallet.
                 * I couldn't find why it does.
                 */
                wallet.tokens.push(transaction.asset.nft.tokenId);
            }
        }
    }

    /**
     * Revert the transaction from the sender wallet.
     */
    protected revert(wallet: Wallet, transaction: ITransactionData): void {
        if (transaction.recipientId) {
            // get token back to the previous owner
            if (!wallet.tokens.find(token => token.isEqualTo(transaction.asset.nft.tokenId))) {
                /* TODO: remove condition
                 * Condition is used because `apply` function is called twice (by transaction-pool and block processor)
                 * without condition, token id is pushed twice in wallet
                 * Issue is that `transaction-pool` and `block-processor` should not execute `apply` on the same wallet.
                 * I couldn't find why it does.
                 */
                wallet.tokens.push(transaction.asset.nft.tokenId);
            }
        } else {
            // it was a token mint
            this.removeTokenFromWallet(wallet, transaction);
        }
    }

    private removeTokenFromWallet(wallet: Wallet, transaction: ITransactionData): void {
        const transferredTokenIndex = wallet.tokens.findIndex(tokenId => tokenId === transaction.asset.nft.tokenId);
        wallet.tokens.splice(transferredTokenIndex, 1);
    }
}
