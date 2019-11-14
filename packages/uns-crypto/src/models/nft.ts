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

    public updateProperties(properties: { [_: string]: string }) {
        const propertyKeys = Object.keys(properties);
        for (const key of propertyKeys) {
            const propertyValue = properties[key];
            this.updateProperty(key, propertyValue);
        }
        return this;
    }
}
