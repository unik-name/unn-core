const tokenId = {
    $id: "tokenId",
    allOf: [{ $ref: "hex" }, { minLength: 64, maxLength: 64 }],
};

const nftToken = {
    type: "object",
    required: ["tokenId"],
    properties: {
        tokenId: { ...tokenId },
    },
};

export const nft = {
    asset: {
        type: "object",
        required: ["nft"],
        additionalProperties: false,
        properties: {
            nft: {
                type: "object",
                patternProperties: {
                    "^.*$": { ...nftToken },
                },
            },
        },
    },
};

export const nftProperties = {
    asset: {
        properties: {
            nft: {
                type: "object",
                patternProperties: {
                    "^.*$": {
                        properties: {
                            properties: {
                                type: "object",
                                minProperties: 1,
                                maxProperties: 255,
                                patternProperties: {
                                    "^.*$": { maxLength: 255 },
                                },
                                propertyNames: { maxLength: 255 },
                            },
                        },
                    },
                },
            },
        },
    },
};

export const nftUpdateProperties = {
    asset: {
        properties: {
            nft: {
                type: "object",
                patternProperties: {
                    "^.*$": {
                        required: ["properties"],
                    },
                },
            },
        },
    },
};
