import { ITransactionData, Wallet } from "../../models";
import { Handler } from "./handler";

export class NftUpdateHandler extends Handler {
    /**
     * Check if the transaction can be applied to the wallet.
     */
    public canApply(wallet: Wallet, transaction: ITransactionData, errors: string[]): boolean {
        if (!super.canApply(wallet, transaction, errors)) {
            return false;
        }

        // only token owner can submit nft update transactions
        return wallet.tokens.includes(transaction.asset.nft.tokenId);
    }

    /**
     * Apply the transaction to the wallet.
     */
    protected apply(wallet: Wallet, transaction: ITransactionData): void {
        // action delegated to the nft manager
    }

    /**
     * Revert the transaction from the wallet.
     */
    protected revert(wallet: Wallet, transaction: ITransactionData): void {
        // cannot get back property value...
    }
}
