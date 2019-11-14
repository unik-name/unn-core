import { app } from "@arkecosystem/core-container";
import { Database, Logger } from "@arkecosystem/core-interfaces";
import { models } from "@uns/crypto";

const database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const nftRepository = database.connection.nftsRepository;
const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

export abstract class NFTModifier {
    public static async exists(tokenId: string) {
        const token = await nftRepository.findById(tokenId);
        return token && token !== null;
    }

    public static async insert(tokenId: string, owner: string) {
        return nftRepository.insert(new models.Nft(tokenId, owner)).then(_ => {
            logger.debug(`[💎] New token (id:${tokenId}, owner:${owner})`);
        });
    }

    public static async delete(tokenId: string) {
        return nftRepository.delete(tokenId).then(_ => {
            logger.debug(`[💎] Token deleted (id:${tokenId}) and its properties`);
        });
    }

    public static async updateOwner(tokenId: string, newOwner: string) {
        return nftRepository.updateOwnerId(tokenId, newOwner).then(_ => {
            logger.debug(`[💎] Token transferred (id:'${tokenId}' to:${newOwner})`);
        });
    }

    public static async getProperty(tokenId: string, propertyKey: string) {
        return nftRepository.findPropertyByKey(tokenId, propertyKey);
    }

    public static async hasProperty(tokenId: string, propertyKey: string): Promise<boolean> {
        const property = await NFTModifier.getProperty(tokenId, propertyKey);
        return property && property !== null;
    }

    public static async insertProperty(propertyKey: string, propertyValue: string, tokenId: any): Promise<any> {
        return nftRepository.insertProperty(tokenId, propertyKey, propertyValue).then(_ => {
            logger.debug(`[💎] Property '${propertyKey}' added with value '${propertyValue}' for tokenid ${tokenId}`);
        });
    }

    public static async updateProperty(propertyKey: string, propertyValue: string, tokenId: string): Promise<any> {
        return nftRepository.updateProperty(tokenId, propertyKey, propertyValue).then(_ => {
            logger.debug(`[💎] Property '${propertyKey}' updated with value '${propertyValue}' for tokenid ${tokenId}`);
        });
    }

    public static async deleteProperty(propertyKey: string, tokenId: string): Promise<any> {
        return nftRepository.deletePropertyByKey(tokenId, propertyKey).then(_ => {
            logger.debug(`[💎] Property '${propertyKey}' deleted for tokenid ${tokenId}`);
        });
    }
}
