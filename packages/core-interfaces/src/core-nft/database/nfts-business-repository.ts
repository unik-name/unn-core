import { Interfaces } from "@arkecosystem/crypto";
import { Database } from "../..";

export interface INftsBusinessRepository {
    findById(id: string): Promise<any>;
    findProperties(id: string, params?: Database.IParameters): Promise<any>;
    findProperty(id: string, key: string): Promise<any>;
    findEdgeTransactions(id: string, nftName: string): Promise<any>;
    search(params: Database.IParameters): Promise<any>;
    findTransactionsByAsset(
        asset: any,
        types: number[],
        typeGroup: number,
        order?: string,
    ): Promise<Interfaces.ITransactionData[]>;
}
