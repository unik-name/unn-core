export interface INFT {
    id: Buffer;
    owner: string;
    properties: { [_: string]: string };
    updateOwner(owner: string);
    updateProperty(key: string, value: string);
    updateProperties(properties: Array<[string, string]>);
}

export interface INFTManager {
    readonly tokens: { [id: string]: INFT };
    start(): INFTManager;
    stop(): void;
    isRegistered(tokenId: Buffer): boolean;
    findById(tokenId: Buffer): INFT;
    register(token: INFT): boolean;
}
