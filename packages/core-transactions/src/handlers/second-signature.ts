import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    ITransactionData,
    SecondSignatureRegistrationTransaction,
    Transaction,
    TransactionConstructor,
} from "@arkecosystem/crypto";
import { SecondSignatureAlreadyRegisteredError } from "../errors";
import { TransactionHandler } from "./transaction";

export class SecondSignatureTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return SecondSignatureRegistrationTransaction;
    }

    public async canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): Promise<boolean> {
        if (wallet.secondPublicKey) {
            throw new SecondSignatureAlreadyRegisteredError();
        }

        return super.canBeApplied(transaction, wallet, walletManager);
    }

    public async apply(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        wallet.secondPublicKey = transaction.data.asset.signature.publicKey;
    }

    public async revert(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        wallet.secondPublicKey = null;
    }

    public async canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): Promise<boolean> {
        return !(await this.typeFromSenderAlreadyInPool(data, guard));
    }
}
