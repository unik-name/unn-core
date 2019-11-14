import { Interfaces } from "@arkecosystem/crypto";
import { models } from "..";

export interface ITransactionNftAsset extends Interfaces.ITransactionAsset {
    nft?: {
        [_: string]: INftAsset;
    };
    "disclose-demand"?: IDiscloseDemand;
    "disclose-demand-certification"?: IDiscloseDemandCertification;
}

export interface INftAsset {
    tokenId: string;
    properties?: {
        [_: string]: string;
    };
}

/*ts-lint:disable:interface-over-type-literal*/
interface ICertificationable {
    sub: string;
    iss: string;
    iat: number;
}

export type IDiscloseDemandPayload = ICertificationable & {
    explicitValue: string[];
    type: models.DIDTypes;
};
export type IDiscloseDemandCertificationPayload = ICertificationable;

interface ICertifiedDemand<T extends ICertificationable> {
    payload: T;
    signature: string;
}

export type IDiscloseDemand = ICertifiedDemand<IDiscloseDemandPayload>;

export type IDiscloseDemandCertification = ICertifiedDemand<ICertificationable>;

export interface INft {
    id: string;
    ownerId: string;
}
