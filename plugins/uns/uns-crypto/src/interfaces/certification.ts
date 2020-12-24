import { Utils } from "@arkecosystem/crypto";
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

export type INftDemandCertificationPayload = ICertificationable & {
    cost: Utils.BigNumber;
};

export type INftDemand = Interfaces.ITransactionNftAssetData & {
    demand: ICertifiedDemand<INftDemandPayload>;
};

export type INftCertificationAsset = Interfaces.ITransactionNftAssetData & {
    certification: INftDemandCertification;
};

export type INftDemandCertification = ICertifiedDemand<INftDemandCertificationPayload>;
