import { app } from "@arkecosystem/core-container";
import { Database, NFT } from "@arkecosystem/core-interfaces";
import limitRows from "../repositories/utils/limit-rows";
import { SearchParameterConverter } from "../repositories/utils/search-parameter-converter";

// TODO: uns : ugly workaround to prevent modification of Ark repositories interfaces
const asPostgresConnection = (connection: Database.IConnection) => {
    return connection as any; // PostgresConnection;
};

class NftsBusinessRepository implements NFT.INftsBusinessRepository {
    private databaseService: Database.IDatabaseService;

    constructor() {
        this.databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    }

    public async findById(id: string) {
        return await asPostgresConnection(this.databaseService.connection).db.nfts.findById(id);
    }

    public async findProperties(id: string, params: Database.IParameters = {}) {
        const properties = await asPostgresConnection(this.databaseService.connection).db.nfts.findProperties(id);
        return {
            rows: limitRows(properties, params),
            count: properties.length,
        };
    }

    public async findProperty(id: string, key: string) {
        return await asPostgresConnection(this.databaseService.connection).db.nfts.findPropertyByKey(id, key);
    }

    public async search(params: Database.IParameters) {
        return asPostgresConnection(this.databaseService.connection).db.nfts.search(this.parseSearchParams(params));
    }

    private parseSearchParams(params: Database.IParameters): Database.ISearchParameters {
        const nftsRepository = asPostgresConnection(this.databaseService.connection).db.nfts;
        const searchParameters = new SearchParameterConverter(nftsRepository.getModel()).convert(params);
        return searchParameters;
    }
}

export const businessRepository = new NftsBusinessRepository();
