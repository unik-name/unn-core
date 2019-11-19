import { Database, NFT } from "@arkecosystem/core-interfaces";
import limitRows from "../repositories/utils/limit-rows";
import { SearchParameterConverter } from "../repositories/utils/search-parameter-converter";

export class NftsBusinessRepository implements NFT.INftsBusinessRepository {
    constructor(private connection) {} // TODO: uns : connection is voluntarily not typed to prevent cast to PostgresConnection. Warning : it won't work if it's not postgres connection or if `db` became private

    public async findById(id: string) {
        return await this.connection.db.nfts.findById(id);
    }

    public async findProperties(id: string, params: Database.IParameters = {}) {
        const properties = await this.connection.db.nfts.findProperties(id);
        return {
            rows: limitRows(properties, params),
            count: properties.length,
        };
    }

    public async findProperty(id: string, key: string) {
        return await this.connection.db.nfts.findPropertyByKey(id, key);
    }

    public async search(params: Database.IParameters) {
        return this.connection.db.nfts.search(this.parseSearchParams(params));
    }

    private parseSearchParams(params: Database.IParameters): Database.ISearchParameters {
        const nftsRepository = this.connection.db.nfts;
        const searchParameters = new SearchParameterConverter(nftsRepository.getModel()).convert(params);
        return searchParameters;
    }
}
