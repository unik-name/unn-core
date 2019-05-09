import { app } from "@arkecosystem/core-container";
import { NFT } from "@arkecosystem/core-interfaces";
import Boom from "boom";
import { ServerCache } from "../../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const nftManager: NFT.INFTManager = app.resolvePlugin<NFT.INFTManager>("nft");

const index = async request => {
    const tokens = Object.values(nftManager.tokens);
    const data = { rows: tokens, count: tokens.length }; // Tweak to fit with repository query (see other api endpoints)
    return toPagination(request, data, "nft");
};

const show = async request => {
    const token = nftManager.findById(request.params.id);

    if (!token) {
        return Boom.notFound(`Token ${request.params.id} not found`);
    }

    return respondWithResource(request, token, "nft");
};

export function registerMethods(server) {
    ServerCache.make(server)
        .method("v2.nfts.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.nfts.show", show, 8, request => ({ id: request.params.id }));
}
