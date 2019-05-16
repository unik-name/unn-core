import { IParameters } from "./parameters";
export interface INftsBusinessRepository {
    findById(id: string): Promise<any>;
    search(params: IParameters): Promise<any>;
}
