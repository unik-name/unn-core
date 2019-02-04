import Boom from "boom";
import { ServerCache } from "../../../services";
import { paginate } from "../utils";

const index = async _ => {
    // const tokens = nftManager.tokens;
    // return {
    //     result: tokens,
    //     totalCount: tokens.length,
    // };
};

const show = async request => {
    // const nft = nftManager.findById(request.id);
    // if (!nft) {
    //     return Boom.notFound("Nft not found");
    // }
    // return {
    //     data: nft,
    // };
};

export function registerMethods(server) {
    ServerCache.make(server)
        .method("v2.nft.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.nft.show", show, 8, request => ({ id: request.params.id }));
}
