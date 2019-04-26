import { NFT as _NFT_ } from "@arkecosystem/core-interfaces";
import { Bignum } from "@arkecosystem/crypto";

export class NFT implements _NFT_.INFT {
    public id: Bignum;
    public owner: string;
    public properties: { [_: string]: string };

    constructor(id: Bignum, owner: string) {
        this.id = id;
        this.owner = owner;
        this.properties = {};
    }

    public updateOwner(owner: string) {
        this.owner = owner;
    }

    public updateProperty(key: string, value: string) {
        this.properties[key] = value;
        return this;
    }

    public updateProperties(properties: Array<[string, string]>) {
        properties.map(property => this.updateProperty(property[0], property[1]));
        return this;
    }
}
