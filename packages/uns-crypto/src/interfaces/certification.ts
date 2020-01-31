import { Interfaces } from "@uns/core-nft-crypto";

/*ts-lint:disable:interface-over-type-literal*/
export interface ICertificationable {
    sub: string;
    iss: string;
    iat: number;
}

export interface ICertifiedDemand<T extends ICertificationable> {
    payload: T;
    signature: string;
}

export type INftDemandPayload = ICertificationable & {
    cryptoAccountAddress: string;
};

export type INftDemand = Interfaces.ITransactionNftAssetData & {
    demand: ICertifiedDemand<INftDemandPayload>;
};
