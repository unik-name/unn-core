import { Interfaces } from "@arkecosystem/crypto";

export const checkCommonFields = (deserialized: Interfaces.ITransaction, expected) => {
    const fieldsToCheck = ["version", "network", "type", "senderPublicKey", "fee", "amount", "nonce"];
    for (const field of fieldsToCheck) {
        expect(deserialized.data[field].toString()).toEqual(expected[field].toString());
    }
};
// NFT properties assets
export const propertiesAssets = [
    {
        propKey: "propValue",
    },

    {
        propKey: "propValue",
        propKey2: "propValue2",
    },
    {
        phone: "+33612345678",
        btc: "3Ayxz5xn9p2QRRTtohD28DjfJMGD5hQoGt",
        url: "https://www.uns.network/",
        // tslint:disable-next-line: no-null-keyword
        null: null,
        empty: "",
    },
];
