import * as Joi from "joi";

export const index: object = {
    query: {
        kpub: Joi.alternatives(
            Joi.string()
                .alphanum()
                .length(34),
            Joi.string()
                .hex()
                .length(66),
        ),
    },
};
