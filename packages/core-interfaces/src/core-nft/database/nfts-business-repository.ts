import { Database } from "../..";

export interface INftsBusinessRepository {
    findById(id: string): Promise<any>;
    findProperties(id: string, params?: Database.IParameters): Promise<any>;
    findProperty(id: string, key: string): Promise<any>;
    search(params: Database.IParameters): Promise<any>;
}
