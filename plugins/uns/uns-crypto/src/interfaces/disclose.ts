import { DIDTypes } from "../models";
import { ICertificationable, ICertifiedDemand } from "./certification";

export type IDiscloseDemandPayload = ICertificationable & {
    explicitValue: string[];
    type: DIDTypes;
};

export type IDiscloseDemandCertificationPayload = ICertificationable;

export type IDiscloseDemand = ICertifiedDemand<IDiscloseDemandPayload>;

export type IDiscloseDemandCertification = ICertifiedDemand<ICertificationable>;
