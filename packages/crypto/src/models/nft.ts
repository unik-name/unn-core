export class Nft {
    public id: string;
    public ownerId: string;
    public properties: { [_: string]: string };

    constructor(id: string, ownerId: string) {
        this.id = id;
        this.ownerId = ownerId;
        this.properties = {};
    }

    public updateOwnerId(ownerId: string) {
        this.ownerId = ownerId;
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
