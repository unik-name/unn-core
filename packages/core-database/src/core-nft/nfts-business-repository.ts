import { Database, NFT } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import limitRows from "../repositories/utils/limit-rows";
import { SearchParameterConverter } from "../repositories/utils/search-parameter-converter";

export class NftsBusinessRepository implements NFT.INftsBusinessRepository {
    constructor(private connection) {} // TODO: uns : connection is voluntarily not typed to prevent cast to PostgresConnection. Warning : it won't work if it's not postgres connection or if `db` became private

    public findById(id: string) {
        return this.connection.db.nfts.findById(id);
    }

    public async findProperties(id: string, params: Database.IParameters = {}) {
        const properties = await this.connection.db.nfts.findProperties(id);
        return {
            rows: limitRows(properties, params),
            count: properties.length,
        };
    }

    public findProperty(id: string, key: string) {
        return this.connection.db.nfts.findPropertyByKey(id, key);
    }

    public findPropertyBatch(ids: string[], key: string) {
        return this.connection.db.nfts.findPropertyBatch(ids, key);
    }

    public findEdgeTransactions(id: string, nftName: string): Promise<any> {
        return this.connection.db.nfts.findEdgeTransactions(id, nftName);
    }

    public async search(params: Database.IParameters) {
        return this.connection.db.nfts.search(this.parseSearchParams(params));
    }

    public status(nftName: string) {
        return this.connection.db.nfts.status(nftName);
    }

    public async findTransactionsByAsset(
        asset: any,
        types: number[],
        typeGroup: number,
        order: string = "asc",
    ): Promise<Interfaces.ITransactionData[]> {
        return this.connection.db.nfts.findTransactionsByAsset(asset, types, typeGroup, order);
    }

    private parseSearchParams(params: Database.IParameters): Database.ISearchParameters {
        const nftsRepository = this.connection.db.nfts;
        const searchParameters = new SearchParameterConverter(nftsRepository.getModel()).convert(params);
        return searchParameters;
    }
}
