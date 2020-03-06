export const unsDiscloseDemand = {
    asset: {
        type: "object",
        required: ["disclose-demand", "disclose-demand-certification"],
        additionalProperties: false,
        properties: {
            "disclose-demand": {
                type: "object",
                required: ["payload", "signature"],
                properties: {
                    signature: { $ref: "hex" },
                },
            },
            "disclose-demand-certification": {
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
