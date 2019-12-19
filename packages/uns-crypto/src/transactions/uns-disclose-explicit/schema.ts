import { DIDHelpers } from "../../models";

export const unsDiscloseDemandCertificationPayload = {
    type: "object",
    required: ["sub", "iss", "iat"],
    additionalProperties: false,
    properties: {
        sub: { $ref: "hex" },
        iss: { $ref: "tokenId" },
        iat: { type: "integer" },
    },
};

export const unsDiscloseDemandPayload = {
    type: "object",
    required: ["explicitValue", "sub", "type", "iss", "iat"],
    additionalProperties: false,
    properties: {
        explicitValue: {
            type: "array",
            minItems: 1,
            maxItems: 255,
            items: { type: "string" },
        },
        sub: { $ref: "tokenId" },
        type: { type: "integer", enum: DIDHelpers.codes() /*FIXME this statement has no effect*/ },
        iss: { $ref: "tokenId" },
        iat: { type: "integer" },
    },
};

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
                    payload: unsDiscloseDemandPayload,
                    signature: { $ref: "hex" },
                },
            },
            "disclose-demand-certification": {
                type: "object",
                required: ["payload", "signature"],
                properties: {
                    payload: unsDiscloseDemandCertificationPayload,
                    signature: { $ref: "hex" },
                },
            },
        },
    },
};
