import { Bignum } from "../utils";

export class NFT {
    public id: Bignum;
    public properties: { [_: string]: string };

    constructor(id: Bignum) {
        this.id = id;
        this.properties = {};
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
