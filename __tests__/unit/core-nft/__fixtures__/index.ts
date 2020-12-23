import { Wallets } from "@arkecosystem/core-state";
import { Utils } from "@arkecosystem/crypto";

export const nftName: string = "mynft";
export const nftId: string = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

export const constraints = {
    mynft: {
        name: "mynft",
        properties: {
            genesisProp: {
                genesis: true,
            },
            immutableProp: {
                constraints: ["immutable"],
            },
            numberProp: {
                constraints: [
                    {
                        name: "type",
                        parameters: {
                            type: "number",
                            min: 1,
                            max: 3,
                        },
                    },
                ],
            },
            enumProp: {
                constraints: [
                    {
                        name: "enumeration",
                        parameters: {
                            values: ["foo", "bar", "3"],
                        },
                    },
                ],
            },
        },
    },
};

export const network = "dalinet";
export const properties = { foo: "true" };
export const recipient: string = "DA3BSpo52UqTnKVjZ4MhEVV2zzZT8WhVHf";
export const propertiesAssets: any[] = [
    {},
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

export const wallet = () => {
    const wallet = new Wallets.Wallet("DA3BSpo52UqTnKVjZ4MhEVV2zzZT8WhVHf");
    wallet.balance = Utils.BigNumber.make("500000000000000");
    wallet.publicKey = "03d11c3889fbfbd0e991ce88d1af630afd501401c4e8e464a4400fc2b6cf1789f1";
    return wallet;
};
export const walletPassphrase: string =
    "enrich account dirt wedding noise acquire pipe rescue link quality laugh rough";

export const tooLongPropertyValue: string = "💎".repeat(64);
