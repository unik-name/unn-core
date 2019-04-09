import { constants, ITransactionData } from "@arkecosystem/crypto";

const { TransactionTypes } = constants;

function isNftTransaction(transaction: ITransactionData): boolean {
    return transaction.type === TransactionTypes.NftTransfer || transaction.type === TransactionTypes.NftUpdate;
}

export { isNftTransaction };
