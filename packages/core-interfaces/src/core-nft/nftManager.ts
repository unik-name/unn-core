import { Bignum } from "@arkecosystem/crypto";

export interface INFT {
    id: Bignum;
    properties: { [_: string]: string };
    updateProperty(key: string, value: string);
    updateProperties(properties: Array<[string, string]>);
}

export interface INFTManager {
    readonly tokens: { [id: string]: INFT };
    start(): INFTManager;
    stop(): void;
    isRegistered(tokenId: Bignum): boolean;
    findById(tokenId: Bignum): INFT;
}
