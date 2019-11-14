import { Interfaces } from "@arkecosystem/crypto";
import { constants } from "@uns/crypto";

const { TransactionTypes } = constants;

export const isNftTransaction = (transaction: Interfaces.ITransactionData): boolean => {
    return (
        transaction.type === TransactionTypes.NftTransfer ||
        transaction.type === TransactionTypes.NftUpdate ||
        transaction.type === TransactionTypes.NftMint ||
        transaction.type === TransactionTypes.UnsDiscloseExplicit
    );
};
