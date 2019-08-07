import { Database } from "@arkecosystem/core-interfaces";
import limitRows = require("./utils/limit-rows");
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class NftsBusinessRepository implements Database.INftsBusinessRepository {
    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {}

    public async findById(id: string) {
        return await this.databaseServiceProvider().connection.nftsRepository.findById(id);
    }

    public async findProperties(id: string, params: Database.IParameters = {}) {
        const properties = await this.databaseServiceProvider().connection.nftsRepository.findProperties(id);
        return {
            rows: limitRows(properties, params),
            count: properties.length,
        };
    }

    public async search(params: Database.IParameters) {
        return this.databaseServiceProvider().connection.nftsRepository.search(this.parseSearchParams(params));
    }

    private parseSearchParams(params: Database.IParameters): Database.SearchParameters {
        const nftsRepository = this.databaseServiceProvider().connection.nftsRepository;
        const searchParameters = new SearchParameterConverter(nftsRepository.getModel()).convert(params);
        return searchParameters;
    }
}
