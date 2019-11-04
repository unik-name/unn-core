import { TransactionPool } from "@arkecosystem/core-interfaces";
import { Dato } from "@faustbrian/dato";

import { constants, ITransactionData, models, Transaction } from "@arkecosystem/crypto";

export class Connection implements TransactionPool.IConnection {
    public options: any;
    public loggedAllowedSenders: string[];
    public walletManager: any;

    public async make(): Promise<this> {
        return this;
    }

    public driver(): any {
        return;
    }

    public disconnect(): void {
        return;
    }

    public async getPoolSize(): Promise<number> {
        return 0;
    }

    public async getSenderSize(senderPublicKey: string): Promise<number> {
        return 0;
    }

    public addTransactions(
        transactions: Transaction[],
    ): Promise<{
        added: Transaction[];
        notAdded: TransactionPool.IAddTransactionErrorResponse[];
    }> {
        return Promise.resolve({ added: [], notAdded: [] });
    }

    public addTransaction(transaction: Transaction): Promise<TransactionPool.IAddTransactionResponse> {
        return Promise.resolve(null);
    }

    public removeTransaction(transaction: Transaction): void {
        return;
    }

    public removeTransactionById(id: string, senderPublicKey?: string): void {
        return;
    }

    public async getTransactionsForForging(blockSize: number): Promise<string[]> {
        return [];
    }

    public async getTransaction(id: string): Promise<Transaction> {
        return null;
    }

    public async getTransactions(start: number, size: number, maxBytes?: number): Promise<Buffer[]> {
        return [];
    }

    public async getTransactionIdsForForging(start: number, size: number): Promise<string[]> {
        return null;
    }

    public async getTransactionsData(
        start: number,
        size: number,
        property: string,
        maxBytes?: number,
    ): Promise<string[] | Buffer[]> {
        return null;
    }

    public getTransactionsByType(type: any): any {
        return;
    }

    public removeTransactionsForSender(senderPublicKey: string): void {
        return;
    }

    public async hasExceededMaxTransactions(transaction: ITransactionData): Promise<boolean> {
        return true;
    }

    public flush(): void {
        return;
    }

    public async transactionExists(transactionId: string): Promise<boolean> {
        return false;
    }

    public isSenderBlocked(senderPublicKey: string): boolean {
        return true;
    }

    public blockSender(senderPublicKey: string): Dato {
        return null;
    }

    public acceptChainedBlock(block: models.Block): Promise<void> {
        return Promise.resolve();
    }

    public async buildWallets(): Promise<void> {
        return;
    }

    public purgeByPublicKey(senderPublicKey: string): void {
        return;
    }

    public purgeSendersWithInvalidTransactions(block: models.Block): void {
        return;
    }

    public async purgeBlock(block: models.Block): Promise<void> {
        return;
    }

    public async senderHasTransactionsOfType(
        senderPublicKey: string,
        transactionType: constants.TransactionTypes,
    ): Promise<boolean> {
        return true;
    }
}
