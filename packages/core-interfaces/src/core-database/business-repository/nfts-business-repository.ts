import { IParameters } from "./parameters";
export interface INftsBusinessRepository {
    findById(id: string): Promise<any>;
    findProperties(id: string, params?: IParameters): Promise<any>;
    search(params: IParameters): Promise<any>;
}
