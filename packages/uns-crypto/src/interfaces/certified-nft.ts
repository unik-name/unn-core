import { INftAsset } from "@uns/core-nft-crypto/dist/interfaces";
import { ICertificationable, ICertifiedDemand } from "./certification";

export type INftMintDemandCertificationPayload = ICertificationable;

export type INftMintDemandCertification = ICertifiedDemand<ICertificationable>;

export interface INftMintDemand {
    nft: {
        [_: string]: INftAsset;
    };
}
