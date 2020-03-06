import { UNS_NFT_PROPERTY_KEY_REGEX } from "@uns/crypto";

export const defaults = {
    constraints: {
        unik: {
            name: "UNIK",
            propertyKey: {
                constraints: [
                    {
                        name: "regex",
                        parameters: {
                            pattern: UNS_NFT_PROPERTY_KEY_REGEX,
                            contextAttribute: "key",
                        },
                    },
                ],
            },
            properties: {
                type: {
                    genesis: true,
                    constraints: [
                        "immutable",
                        {
                            name: "enumeration",
                            parameters: {
                                values: ["1", "2", "3"],
                            },
                        },
                    ],
                },
            },
        },
    },
};
