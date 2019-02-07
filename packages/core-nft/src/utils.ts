import { constants, models } from "@arkecosystem/crypto";

const { TransactionTypes } = constants;

function isNftTransaction(transaction: models.ITransactionData): boolean {
    return transaction.type === TransactionTypes.NftTransfer || transaction.type === TransactionTypes.NftUpdate;
}

export { isNftTransaction };
