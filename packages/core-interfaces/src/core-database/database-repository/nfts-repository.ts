import { models } from "@arkecosystem/crypto";
import { SearchParameters } from "../search";
import { IRepository } from "./repository";

export interface INftsRepository extends IRepository {
    /**
     * Find a nft by its ID.
     */
    findById(id: string): Promise<any>;
    search(params: SearchParameters): Promise<any>;
    delete(id: string): Promise<any>;
    updateOwnerId(id: string, newOwnerId: string): Promise<any>;
}
