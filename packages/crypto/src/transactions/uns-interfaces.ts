import { models } from "..";

/*ts-lint:disable:interface-over-type-literal*/
interface Certificationable {
    sub: string;
    iss: string;
    iat: number;
}

export type DiscloseDemandPayload = Certificationable & {
    explicitValue: string[];
    type: models.DIDTypes;
};
export type DiscloseDemandCertificationPayload = Certificationable;

interface CertifiedDemand<T extends Certificationable> {
    payload: T;
    signature: string;
}

export type DiscloseDemand = CertifiedDemand<DiscloseDemandPayload>;

export type DiscloseDemandCertification = CertifiedDemand<Certificationable>;
