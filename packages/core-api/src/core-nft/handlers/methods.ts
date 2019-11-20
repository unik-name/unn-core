import { app } from "@arkecosystem/core-container";
import { ConnectionManager, NftsBusinessRepository } from "@arkecosystem/core-database";
import Boom from "@hapi/boom";
import { paginate, respondWithResource, toPagination } from "../../handlers/utils";
import { ServerCache } from "../../services";

const nftsRepository: NftsBusinessRepository = new NftsBusinessRepository(
    app.resolvePlugin<ConnectionManager>("database-manager").connection(),
);

const index = async request => {
    const nfts = await nftsRepository.search({
        ...request.query,
        ...paginate(request),
    });
    return toPagination(nfts, "nft");
};

const show = async request => {
    const nft = await nftsRepository.findById(request.params.id);

    if (!nft) {
        return Boom.notFound(`Non fungible token ${request.params.id} not found`);
    }

    return respondWithResource(nft, "nft");
};

const properties = async request => {
    const properties = await nftsRepository.findProperties(request.params.id, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(properties, "nftProperties");
};

const property = async request => {
    const property = await nftsRepository.findProperty(request.params.id, request.params.key);

    return respondWithResource(property, "nftProperty");
};

const search = async request => {
    const nfts = await nftsRepository.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(nfts, "nft");
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.nfts.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.nfts.show", show, 8, request => ({ id: request.params.id }))
        .method("v2.nfts.properties", properties, 8, request => ({
            id: request.params.id,
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.nfts.property", property, 8, request => ({ id: request.params.id, key: request.params.key }))
        .method("v2.nfts.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
