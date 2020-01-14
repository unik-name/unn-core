export const unsCertifiedMint = {
    asset: {
        required: ["certification"],
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
        },
    },
};
