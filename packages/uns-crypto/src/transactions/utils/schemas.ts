import { Transactions } from "@arkecosystem/crypto";

import { models } from "../..";
import { UnsTransactionType } from "../../enums";


const unsDiscloseDemandCertificationPayload = {
    asset: {
        type: "object",
        required: ["sub", "iss", "iat"],
        additionalProperties: false,
        properties: {
            sub: { $ref: "hex" },
            iss: { $ref: "tokenId" },
            iat: { type: "integer" },
        },
    },
};

const unsDiscloseDemandPayload = {
    asset: {
        type: "object",
        required: ["explicitValue", "sub", "type", "iss", "iat"],
        additionalProperties: false,
        properties: {
            explicitValue: {
                type: "array",
                minItems: 1,
                maxItems: 255,
                items: { $ref: "alphanumeric" },
            },
            sub: { $ref: "tokenId" },
            type: { type: "integer", enum: models.DIDTypes /*FIXME this statement has no effect*/ },
            iss: { $ref: "tokenId" },
            iat: { type: "integer" },
        },
    },
};

const unsDiscloseDemand = {
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

export const discloseExplicit = Transactions.schemas.extend(Transactions.schemas.transactionBaseSchema, {
    $id: "unsDiscloseExplicit",
    required: ["asset"],
    properties: {
        type: { transactionType: UnsTransactionType.UnsDiscloseExplicit },
        amount: { bignumber: { minimum: 0, maximum: 0 } },
        ...unsDiscloseDemand,
    },
});
