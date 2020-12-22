import { Interfaces } from "@arkecosystem/crypto";
import { Database } from "../..";

export interface INftsRepository extends Database.IRepository {
    /**
     * Find a nft by its ID.
     */
    findById(id: string, nftName?: string): Promise<any>;
    search(params: Database.ISearchParameters): Promise<any>;
    delete(id: string): Promise<any>;
    updateOwnerId(id: string, newOwnerId: string): Promise<any>;
    insertProperty(nftid: string, key: string, value: string): Promise<any>;
    findPropertyByKey(nftid: string, key: string): Promise<any>;
    findPropertyBatch(nftids: string[], key: string): Promise<any>;
    deletePropertyByKey(nftid: string, key: string): Promise<any>;
    updateProperty(nftid: string, key: string, value: string): Promise<any>;
    insertOrUpdateProperty(nftid: string, key: string, value: string): Promise<any>;
    findProperties(nftid: string): Promise<any>;
    findEdgeTransactions(id: string, nftName: string): Promise<any>;
    findTransactionsByAsset(
        asset: any,
        types: number[],
        typeGroups: number[],
        order?: string,
    ): Promise<Interfaces.ITransactionData[]>;
}
