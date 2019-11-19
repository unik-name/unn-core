import { Transactions } from "@arkecosystem/crypto";
import { NftTransactionType } from "../../enums";

const { schemas } = Transactions;


const tokenId = {
    allOf: [{ $ref: "hex" }, { minLength: 64, maxLength: 64 }],
};

const nftToken = {
    type: "object",
    required: ["tokenId"],
    properties: {
        tokenId: { ...tokenId },
    },
};

const nft = {
    amount: { bignumber: { minimum: 0, maximum: 0 } },
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

const nftProperties = {
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

const nftUpdateProperties = {
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

export const nftTransfer = schemas.extend(schemas.transactionBaseSchema, {
    $id: "nftTransfer",
    required: ["asset", "recipientId"],
    properties: {
        type: { transactionType: NftTransactionType.NftTransfer },
        recipientId: { $ref: "address" },
        ...nft,
    },
});

export const nftUpdate = schemas.extend(schemas.transactionBaseSchema, {
    $id: "nftUpdate",
    required: ["asset"],
    properties: {
        type: { transactionType: NftTransactionType.NftUpdate },
        ...schemas.extend(nft, schemas.extend(nftProperties, nftUpdateProperties)), // nft.properties is required
    },
});

export const nftMint = schemas.extend(schemas.transactionBaseSchema, {
    $id: "nftMint",
    required: ["asset"],
    properties: {
        type: { transactionType: NftTransactionType.NftMint },
        ...schemas.extend(nft, nftProperties),
    },
});

