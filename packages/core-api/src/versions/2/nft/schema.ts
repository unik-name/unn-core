import * as Joi from "joi";
import { pagination } from "../shared/schemas/pagination";

const nftId = Joi.string()
    .hex()
    .length(64);

export const index: object = {
    query: {
        ...pagination,
        ...{
            orderBy: Joi.string(),
        },
    },
};

export const show: object = {
    params: {
        id: nftId,
    },
};

export const search: object = {
    query: pagination,
    payload: {
        orderBy: Joi.string(),
        id: nftId,
        ownerId: Joi.string()
            .alphanum()
            .length(34),
    },
};
