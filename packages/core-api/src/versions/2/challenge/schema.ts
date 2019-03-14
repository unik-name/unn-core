import * as Joi from "joi";

export const show: object = {
    params: {
        id: Joi.number()
            .integer()
            .min(1),
    },
};
