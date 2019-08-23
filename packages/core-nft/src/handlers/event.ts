import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { constants, ITransactionData, models } from "@arkecosystem/crypto";
import { isNftTransaction } from "../utils";
import { NFTMintHandler, NFTTransferHandler, NFTUpdateHandler } from "./transactions";

const { TransactionTypes } = constants;
const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

export class NFTEventHandler {
    public static onTransactionApplied(transaction: ITransactionData) {
        // It is impossible to return the promise as the caller is not able to handle it (event emitter)
        // This is something we have to work with Ark developers
        NFTEventHandler.onTransactionAppliedAsync(transaction)
            .catch(error => {
                console.trace("[💎]");
                logger.debug(
                    `[💎] Transaction ${transaction.id} not applied due to ${error.message}. Try to revert it.`,
                );
                return NFTEventHandler.onTransactionRevertedAsync(transaction);
            })
            .catch(error => {
                logger.info(
                    `[💎] Transaction ${transaction.id} revert failed due to ${error.message}. Check database!`,
                );
            });
    }

    public static onBlockReverted(block: models.IBlockData) {
        NFTEventHandler.onBlockRevertedAsync(block).catch(error => {
            logger.error(`[💎] Block not reverted due to ${error.message}`);
        });
    }

    private static async onTransactionAppliedAsync(transaction: ITransactionData) {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                return NFTTransferHandler.onApplied(transaction);
            case TransactionTypes.NftUpdate:
                return NFTUpdateHandler.onApplied(transaction);
            case TransactionTypes.NftMint:
                return NFTMintHandler.onApplied(transaction);
            default:
                return Promise.resolve("Not a NFT transaction. Continue.");
        }
    }

    private static async onTransactionRevertedAsync(transaction: ITransactionData): Promise<any> {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                return NFTTransferHandler.onReverted(transaction);
            case TransactionTypes.NftUpdate:
                return NFTUpdateHandler.onReverted(transaction);
            case TransactionTypes.NftMint:
                return NFTMintHandler.onReverted(transaction);
            default:
                return Promise.reject("Not a NFT transaction. Continue.");
        }
    }

    private static async onBlockRevertedAsync(block: models.IBlockData) {
        let promises = [];
        if (block.transactions) {
            promises = block.transactions.filter(isNftTransaction).map(this.onTransactionRevertedAsync);
        }
        return Promise.all(promises);
    }
}
