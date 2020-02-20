import Boom from "@hapi/boom";
import Joi from "@hapi/joi";
import { pagination, walletId } from "../../handlers/shared/schemas";
import { networkNfts } from "./utils";

const nftsPathParameterFailAction = (_, __, err) => {
    return err &&
        err.isJoi &&
        err.details &&
        err.details.length > 0 &&
        err.details[0].context &&
        err.details[0].context.key === "nft"
        ? Boom.notFound()
        : err;
};

const nftId = Joi.string()
    .hex()
    .length(64);

const nftPathParameterScheme = Joi.string().valid("nft", ...networkNfts());

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
    failAction: nftsPathParameterFailAction,
};

export const show: object = {
    params: {
        nft: nftPathParameterScheme,
        id: nftId,
    },
    failAction: nftsPathParameterFailAction,
};

export const properties: object = {
    params: {
        nft: nftPathParameterScheme,
        id: nftId,
    },
    query: pagination,
    failAction: nftsPathParameterFailAction,
};

export const property: object = {
    params: {
        nft: nftPathParameterScheme,
        id: nftId,
        key: Joi.string().max(255),
    },
    failAction: nftsPathParameterFailAction,
};

export const search: object = {
    params: {
        nft: nftPathParameterScheme,
    },
    query: {
        ...pagination,
    },
    payload: {
        orderBy: Joi.string(),
        id: Joi.alternatives(
            nftId,
            Joi.array()
                .items(nftId)
                .min(1),
        ),
        ownerId: Joi.string()
            .alphanum()
            .length(34),
    },
    failAction: nftsPathParameterFailAction,
};

export const walletNfts: object = {
    params: {
        id: walletId,
        nft: nftPathParameterScheme,
    },
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
        },
    },
};
