import { Database } from "@arkecosystem/core-interfaces";
import { SearchParameterConverter } from "./utils/search-parameter-converter";

export class NftsBusinessRepository implements Database.INftsBusinessRepository {
    constructor(private databaseServiceProvider: () => Database.IDatabaseService) {}

    public async findById(id: string) {
        return await this.databaseServiceProvider().connection.nftsRepository.findById(id);
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
