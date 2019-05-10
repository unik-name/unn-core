import * as Joi from "joi";
import { pagination } from "../shared/schemas/pagination";

export const index: object = {
    query: {
        ...pagination,
    },
};

export const show: object = {
    params: {
        id: Joi.string()
            .hex()
            .min(1)
            .max(64),
    },
};
