import { INft } from "@uns/crypto";
import { IParameters } from "./parameters";

export interface INftsBusinessRepository {
    findById(id: string): Promise<INft>;
    findProperties(id: string, params?: IParameters): Promise<any>;
    findProperty(id: string, key: string): Promise<any>;
    search(params: IParameters): Promise<any>;
}
