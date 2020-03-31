import { IWallet } from "../../core-state";
import { IParameters } from "./parameters";

export interface IRowsPaginated<T> {
    rows: ReadonlyArray<T>;
    count: number;
}

export enum SearchScope {
    Wallets,
    Delegates,
    Locks,
    Businesses,
    Bridgechains,
}

export interface IWalletsBusinessRepository {
    search<T>(scope: SearchScope, params: IParameters): Promise<IRowsPaginated<T>>;
    findById(searchScope: SearchScope, id: string): IWallet;
    count(searchScope: SearchScope): Promise<number>;
    top(searchScope: SearchScope, params?: IParameters): Promise<IRowsPaginated<IWallet>>;
}
