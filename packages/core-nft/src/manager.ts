import { app } from "@arkecosystem/core-container";
import { ConnectionManager } from "@arkecosystem/core-database";
import { Logger, NFT } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@uns/core-nft-crypto";
import { ConstraintsManager } from "./constraints/manager";
import { IConstraintsConfig } from "./interfaces";

export const nftRepository = (): NFT.INftsRepository => {
    return (app.resolvePlugin<ConnectionManager>("database-manager").connection() as any).db.nfts;
};

export class NftsManager {
    public constraints: ConstraintsManager;

    private logger: Logger.ILogger;

    constructor(options) {
        this.logger = app.resolvePlugin<Logger.ILogger>("logger");
        this.constraints = new ConstraintsManager(options.constraints as IConstraintsConfig); // TODO: uns : validate config
    }

    private get repository(): NFT.INftsRepository {
        return nftRepository();
    }

    public async exists(tokenId: string) {
        const token = await this.repository.findById(tokenId);
        return token && token !== null;
    }

    public async insert(id: string, ownerId: string) {
        return this.repository.insert({ id, ownerId }).then(_ => {
            this.logger.debug(`[💎] New token (id:${id}, owner:${ownerId})`);
        });
    }

    public async delete(tokenId: string) {
        return this.repository.delete(tokenId).then(_ => {
            this.logger.debug(`[💎] Token deleted (id:${tokenId}) and its properties`);
        });
    }

    public async updateOwner(tokenId: string, newOwner: string) {
        return this.repository.updateOwnerId(tokenId, newOwner).then(_ => {
            this.logger.debug(`[💎] Token transferred (id:'${tokenId}' to:${newOwner})`);
        });
    }

    public async getProperty(tokenId: string, propertyKey: string) {
        return this.repository.findPropertyByKey(tokenId, propertyKey);
    }

    public async getPropertyBatch(tokenIds: string[], propertyKey: string) {
        return this.repository.findPropertyBatch(tokenIds, propertyKey);
    }

    public async getProperties(tokenId: string) {
        return this.repository.findProperties(tokenId);
    }

    public async hasProperty(tokenId: string, propertyKey: string): Promise<boolean> {
        const property = await this.getProperty(tokenId, propertyKey);
        return property && property !== null;
    }

    public async insertProperty(propertyKey: string, propertyValue: string, tokenId: any): Promise<any> {
        return this.repository.insertProperty(tokenId, propertyKey, propertyValue).then(_ => {
            this.logger.debug(
                `[💎] Property '${propertyKey}' added with value '${propertyValue}' for tokenid ${tokenId}`,
            );
        });
    }

    public async insertProperties(properties: Interfaces.INftProperties, tokenId: string): Promise<any> {
        return Promise.all(
            Object.entries<string>(properties).map(([key, value]) => {
                return this.insertProperty(key, value, tokenId);
            }),
        );
    }

    public async updateProperty(propertyKey: string, propertyValue: string, tokenId: string): Promise<any> {
        return this.repository.updateProperty(tokenId, propertyKey, propertyValue).then(_ => {
            this.logger.debug(
                `[💎] Property '${propertyKey}' updated with value '${propertyValue}' for tokenid ${tokenId}`,
            );
        });
    }

    public async manageProperties(properties: Interfaces.INftProperties, tokenId: string): Promise<any> {
        return Promise.all(
            Object.entries<string>(properties).map(async ([key, value]) => {
                if (value === null) {
                    return this.deleteProperty(key, tokenId);
                } else {
                    return this.insertOrUpdateProperty(key, value, tokenId);
                }
            }),
        );
    }

    public async deleteProperty(propertyKey: string, tokenId: string): Promise<any> {
        return this.repository.deletePropertyByKey(tokenId, propertyKey).then(_ => {
            this.logger.debug(`[💎] Property '${propertyKey}' deleted for tokenid ${tokenId}`);
        });
    }

    public async insertOrUpdateProperty(propertyKey: string, propertyValue: string, tokenId: string): Promise<any> {
        return this.repository.insertOrUpdateProperty(tokenId, propertyKey, propertyValue).then(_ => {
            this.logger.debug(
                `[💎] Property '${propertyKey}' replaced with value '${propertyValue}' for tokenid ${tokenId}`,
            );
        });
    }
}
