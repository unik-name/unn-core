import { IParameters } from "./parameters";
export interface INftsBusinessRepository {
    findById(id: string): Promise<any>;
    findProperties(id: string, params?: IParameters): Promise<any>;
    findProperty(id: string, key: string): Promise<any>;
    search(params: IParameters): Promise<any>;
}
