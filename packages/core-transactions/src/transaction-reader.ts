import { Database } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";
import uniq from "lodash.uniq";

export class TransactionReader {
    public static async create(
        connection: Database.IConnection,
        typeConstructors: Transactions.TransactionConstructor[] | Transactions.TransactionConstructor,
    ): Promise<TransactionReader> {
        const constructors = Array.isArray(typeConstructors) ? typeConstructors : [typeConstructors];
        const typeGroup: number[] = uniq(constructors.map(t => t.typeGroup));

        if (typeGroup.length > 1) {
            throw new Error("Transaction read is restricted to a single typeGroup.");
        }
        const reader: TransactionReader = new TransactionReader(
            connection,
            constructors.map(t => t.type),
            typeGroup[0],
        );
        await reader.init(constructors);
        return reader;
    }

    public bufferSize: number = 1000000000;

    private index: number = 0;
    private count: number = 0;

    private constructor(private connection: Database.IConnection, private types: number[], private typeGroup: number) {}

    public hasNext(): boolean {
        return this.index < this.count;
    }

    public async read(): Promise<Database.IBootstrapTransaction[]> {
        const transactions = await this.connection.transactionsRepository.getAssetsByTypes(
            this.types,
            this.typeGroup,
            this.bufferSize,
            this.index,
        );
        this.index += transactions.length;
        return transactions;
    }

    private async init(constructors: Transactions.TransactionConstructor[]): Promise<void> {
        for (const constructor of constructors) {
            this.count += await this.connection.transactionsRepository.getCountOfType(
                constructor.type,
                constructor.typeGroup,
            );
        }
    }
}
