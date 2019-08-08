import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { ITransactionData } from "@arkecosystem/crypto";
import { NFTModifier } from "../../modifier";

const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

export abstract class NFTUpdateHandler {
    public static async onApplied(transaction: ITransactionData) {
        const { nft } = transaction.asset;
        const { tokenId, properties } = nft;

        if (!(await NFTModifier.exists(tokenId))) {
            return logger.error(`[💎] No token found for id ${tokenId}.`);
        }

        return Promise.all(
            Object.entries(properties).map(async ([key, value]) => {
                if (await NFTModifier.hasProperty(tokenId, key)) {
                    return value === null
                        ? NFTModifier.deleteProperty(key, tokenId)
                        : NFTModifier.updateProperty(key, value, tokenId);
                } else {
                    return value !== null
                        ? NFTModifier.insertProperty(key, value, tokenId)
                        : logger.debug(`[💎] Property '${key}' not found for token ${tokenId}, can't be deleted`);
                }
            }),
        );
    }

    public static async onReverted(transaction: ITransactionData) {
        /*
            TODO: find a way to revert update nft (get old properties values)
            could be saving previous transaction id and apply it again
        */
    }
}
