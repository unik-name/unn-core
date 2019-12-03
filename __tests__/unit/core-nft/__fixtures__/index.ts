export const NFT_NAME: string = "mynft";
export const NFT_ID: string = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";

export const CONSTRAINTS = {
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

export const NETWORK = "dalinet";
