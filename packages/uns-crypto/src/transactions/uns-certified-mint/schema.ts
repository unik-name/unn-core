export const unsCertifiedMint = {
    asset: {
        required: ["certification", "demand"],
        properties: {
            certification: {
                type: "object",
                required: ["payload", "signature"],
                properties: {
                    payload: {
                        type: "object",
                        required: ["iss", "sub", "iat"],
                    },
                    signature: { $ref: "hex" },
                },
            },
            demand: {
                type: "object",
                required: ["payload", "signature"],
                properties: {
                    payload: {
                        type: "object",
                        required: ["iss", "sub", "iat", "cryptoAccountAddress"],
                    },
                    signature: { $ref: "hex" },
                },
            },
        },
    },
};
