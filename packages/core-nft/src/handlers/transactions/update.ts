import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { getCurrentNftAsset, ITransactionData } from "@arkecosystem/crypto";
import { TransactionTypes } from "@arkecosystem/crypto/dist/constants";
import { NFTModifier } from "../../modifier";

const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
const database = app.resolvePlugin<Database.IDatabaseService>("database");

export abstract class NFTUpdateHandler {
    public static async onApplied(transaction: ITransactionData) {
        const { tokenId, properties } = getCurrentNftAsset(transaction);

        if (!(await NFTModifier.exists(tokenId))) {
            return logger.error(`[💎] No token found for id ${tokenId}.`);
        }

        return Promise.all(
            Object.entries(properties).map(async ([key, value]: [string, string]) => {
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
        const currentBlockHeight = (await database.getLastBlock()).data.height;
        const blocks = await database.getBlocks(1, currentBlockHeight - 1);
        const nftName = Object.keys(transaction.asset.nft)[0];
        const { tokenId, properties } = getCurrentNftAsset(transaction);

        // Retrieve all properties evolution since genesis
        let revertedProperties: { [_: string]: string } = {};

        for (const block of blocks) {
            if (block.hasOwnProperty("transactions")) {
                for (const tx of block.transactions) {
                    if (
                        tx.hasOwnProperty("asset") &&
                        tx.asset.hasOwnProperty("nft") &&
                        tx.asset.nft.hasOwnProperty(nftName)
                    ) {
                        const txNft = getCurrentNftAsset(tx);
                        if (txNft.tokenId === tokenId) {
                            if (tx.type === TransactionTypes.NftMint) {
                                revertedProperties = txNft.properties;
                            } else if (tx.type === TransactionTypes.NftUpdate) {
                                Object.entries(txNft.properties).map(([key, value]: [string, string]) => {
                                    if (value) {
                                        revertedProperties[key] = value;
                                    } else {
                                        delete revertedProperties[key];
                                    }
                                });
                            }
                        }
                    }
                }
            }
        }

        // Delete all token properties
        Object.entries(properties).map(async ([key, _]) => {
            await NFTModifier.deleteProperty(key, tokenId);
        });

        // Write new reverted  properties
        Object.entries(revertedProperties).map(async ([key, value]) => {
            await NFTModifier.insertProperty(key, value, tokenId);
        });
    }
}
