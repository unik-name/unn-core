import { Bignum, models } from "@arkecosystem/crypto";

export interface INFTManager {
    readonly tokens: { [id: string]: models.NFT };
    start(): INFTManager;
    stop(): void;
    isRegistered(tokenId: Bignum): boolean;
    findById(tokenId: Bignum): models.NFT;
}
