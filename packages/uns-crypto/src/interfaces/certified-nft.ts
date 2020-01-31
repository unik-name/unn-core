import { ICertificationable, ICertifiedDemand, INftDemand, INftDemandPayload } from "./certification";

export type INftMintDemand = INftDemand;
export type INftMintDemandPayload = INftDemandPayload;
export type INftMintDemandCertification = ICertifiedDemand<ICertificationable>;
export type INftMintDemandCertificationPayload = ICertificationable;

export type INftUpdateDemand = INftDemand;
export type INftUpdateDemandPayload = INftDemandPayload;
export type INftUpdateDemandCertification = ICertifiedDemand<ICertificationable>;
export type INftUpdateDemandCertificationPayload = ICertificationable;
