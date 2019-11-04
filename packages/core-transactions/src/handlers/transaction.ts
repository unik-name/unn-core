// tslint:disable:max-classes-per-file

import { Database, EventEmitter, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    configManager,
    constants,
    crypto,
    ITransactionData,
    Transaction,
    TransactionConstructor,
} from "@arkecosystem/crypto";

import {
    InsufficientBalanceError,
    InvalidSecondSignatureError,
    SenderWalletMismatchError,
    UnexpectedMultiSignatureError,
    UnexpectedSecondSignatureError,
} from "../errors";
import { ITransactionHandler } from "../interfaces";

const { TransactionTypes } = constants;

export abstract class TransactionHandler implements ITransactionHandler {
    public abstract getConstructor(): TransactionConstructor;

    /**
     * Wallet logic
     */
    public async canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): Promise<boolean> {
        // NOTE: Checks if it can be applied based on sender wallet
        // could be merged with `apply` so they are coupled together :thinking_face:

        const { data } = transaction;
        if (wallet.multisignature) {
            throw new UnexpectedMultiSignatureError();
        }

        if (
            wallet.balance
                .minus(data.amount)
                .minus(data.fee)
                .isLessThan(0)
        ) {
            throw new InsufficientBalanceError();
        }

        if (data.senderPublicKey !== wallet.publicKey) {
            throw new SenderWalletMismatchError();
        }

        if (wallet.secondPublicKey) {
            if (!crypto.verifySecondSignature(data, wallet.secondPublicKey)) {
                throw new InvalidSecondSignatureError();
            }
        } else {
            if (data.secondSignature || data.signSignature) {
                // Accept invalid second signature fields prior the applied patch.
                // NOTE: only applies to devnet.
                if (!configManager.getMilestone().ignoreInvalidSecondSignatureField) {
                    throw new UnexpectedSecondSignatureError();
                }
            }
        }

        return true;
    }

    public async applyToSender(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        const { data } = transaction;
        if (data.senderPublicKey === wallet.publicKey || crypto.getAddress(data.senderPublicKey) === wallet.address) {
            wallet.balance = wallet.balance.minus(data.amount).minus(data.fee);

            await this.apply(transaction, wallet);
        }
    }

    public applyToRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.recipientId === wallet.address) {
            wallet.balance = wallet.balance.plus(data.amount);
        }
    }

    public async revertForSender(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        const { data } = transaction;
        if (data.senderPublicKey === wallet.publicKey || crypto.getAddress(data.senderPublicKey) === wallet.address) {
            wallet.balance = wallet.balance.plus(data.amount).plus(data.fee);
            await this.revert(transaction, wallet);
        }
    }

    public revertForRecipient(transaction: Transaction, wallet: Database.IWallet): void {
        const { data } = transaction;
        if (data.recipientId === wallet.address) {
            wallet.balance = wallet.balance.minus(data.amount);
        }
    }

    public abstract async apply(transaction: Transaction, wallet: Database.IWallet): Promise<void>;
    public abstract async revert(transaction: Transaction, wallet: Database.IWallet): Promise<void>;

    /**
     * Database Service
     */
    // tslint:disable-next-line:no-empty
    public emitEvents(transaction: Transaction, emitter: EventEmitter.EventEmitter): void {}

    /**
     * Transaction Pool logic
     */
    public async canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): Promise<boolean> {
        guard.pushError(
            data,
            "ERR_UNSUPPORTED",
            `Invalidating transaction of unsupported type '${TransactionTypes[data.type]}'`,
        );
        return false;
    }

    protected async typeFromSenderAlreadyInPool(
        data: ITransactionData,
        guard: TransactionPool.IGuard,
    ): Promise<boolean> {
        const { senderPublicKey, type } = data;
        if (await guard.pool.senderHasTransactionsOfType(senderPublicKey, type)) {
            guard.pushError(
                data,
                "ERR_PENDING",
                `Sender ${senderPublicKey} already has a transaction of type '${TransactionTypes[type]}' in the pool`,
            );

            return true;
        }

        return false;
    }

    protected async secondSignatureRegistrationFromSenderAlreadyInPool(
        data: ITransactionData,
        guard: TransactionPool.IGuard,
    ): Promise<boolean> {
        const { senderPublicKey } = data;
        if (await guard.pool.senderHasTransactionsOfType(senderPublicKey, TransactionTypes.SecondSignature)) {
            guard.pushError(
                data,
                "ERR_PENDING",
                `Cannot accept transaction from sender ${senderPublicKey} while its second signature registration is in the pool`,
            );

            return true;
        }

        return false;
    }
}
