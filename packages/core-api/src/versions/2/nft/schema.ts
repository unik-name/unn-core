import { app } from "@arkecosystem/core-container";
import Joi from "joi";
import { pagination } from "../shared/schemas/pagination";

const nftId = Joi.string()
    .hex()
    .length(64);

const nfts = app.getConfig().get("network.nfts");
const nftsKey = Object.keys(nfts || {});

const nftPathParameterScheme = Joi.string().valid("nft", ...nftsKey);

export const index: object = {
    params: {
        nft: nftPathParameterScheme,
    },
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
        },
    },
};

export const show: object = {
    params: {
        nft: nftPathParameterScheme,
        id: nftId,
    },
};

export const properties: object = {
    params: {
        nft: nftPathParameterScheme,
        id: nftId,
    },
    query: pagination,
};

export const property: object = {
    params: {
        nft: nftPathParameterScheme,
        id: nftId,
        key: Joi.string().max(255),
    },
};

export const search: object = {
    params: {
        nft: nftPathParameterScheme,
    },
    query: pagination,
    payload: {
        orderBy: Joi.string(),
        id: nftId,
        ownerId: Joi.string()
            .alphanum()
            .length(34),
    },
};
