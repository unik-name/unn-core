import { app } from "@arkecosystem/core-container";
import Boom from "boom";
import Joi from "joi";

export function networkNfts() {
    const networkNfts = app.getConfig().get("network.nfts");
    return Object.keys(networkNfts || {});
}

export function nftsPathParameterFailAction(_, __, err) {
    return err &&
        err.isJoi &&
        err.details &&
        err.details.length > 0 &&
        err.details[0].context &&
        err.details[0].context.key === "nft"
        ? Boom.notFound()
        : err;
}
