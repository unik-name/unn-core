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
