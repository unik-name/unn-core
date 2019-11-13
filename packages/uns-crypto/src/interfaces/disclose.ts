import { DIDTypes } from "../models";

/*ts-lint:disable:interface-over-type-literal*/
interface ICertificationable {
    sub: string;
    iss: string;
    iat: number;
}

export type IDiscloseDemandPayload = ICertificationable & {
    explicitValue: string[];
    type: DIDTypes;
};
export type IDiscloseDemandCertificationPayload = ICertificationable;

interface ICertifiedDemand<T extends ICertificationable> {
    payload: T;
    signature: string;
}

export type IDiscloseDemand = ICertifiedDemand<IDiscloseDemandPayload>;

export type IDiscloseDemandCertification = ICertifiedDemand<ICertificationable>;
