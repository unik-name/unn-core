import { ICertifiedDemand, INftDemand, INftDemandCertificationPayload, INftDemandPayload } from "./certification";

export type INftDemandCertification = ICertifiedDemand<INftDemandCertificationPayload>;

// TODO remove these types and use generic certified demand types
export type INftMintDemand = INftDemand;
export type INftMintDemandPayload = INftDemandPayload;
export type INftMintDemandCertification = ICertifiedDemand<INftDemandCertificationPayload>;
export type INftMintDemandCertificationPayload = INftDemandCertificationPayload;

export type INftUpdateDemand = INftDemand;
export type INftUpdateDemandPayload = INftDemandPayload;
export type INftUpdateDemandCertification = ICertifiedDemand<INftDemandCertificationPayload>;
export type INftUpdateDemandCertificationPayload = INftDemandCertificationPayload;
