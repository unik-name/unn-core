import { Interfaces } from "@uns/core-nft-crypto";
import { ICertificationable, ICertifiedDemand } from "./certification";

export type INftMintDemandCertificationPayload = ICertificationable;

export type INftMintDemandCertification = ICertifiedDemand<ICertificationable>;

export type INftMintDemand = Interfaces.ITransactionNftAssetData & {
    demand: ICertifiedDemand<INftMintDemandPayload>;
};

export type INftMintDemandPayload = ICertificationable & {
    cryptoAccountAddress: string;
};
