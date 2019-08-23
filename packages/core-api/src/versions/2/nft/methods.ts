import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "boom";
import { ServerCache } from "../../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const nftsRepository = databaseService.nftsBusinessRepository;
const transactionsRepository = databaseService.transactionsBusinessRepository;

const index = async request => {
    const nfts = await nftsRepository.search({
        ...request.query,
        ...paginate(request),
    });
    return toPagination(request, nfts, "nft");
};

const show = async request => {
    const nft = await nftsRepository.findById(request.params.id);
    const transactions = await transactionsRepository.findAllByAsset({
        nft: {
            tokenId: `${request.params.id}`,
        },
    });

    if (transactions && transactions.length > 0) {
        nft.transactions = {
            first: {
                id: transactions[0].id,
            },
            last: {
                id: transactions[transactions.length - 1].id,
            },
        };
    }
    if (!nft) {
        return Boom.notFound(`Non fungible token ${request.params.id} not found`);
    }

    return respondWithResource(request, nft, "nft");
};

const properties = async request => {
    const properties = await nftsRepository.findProperties(request.params.id, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, properties, "nftProperties");
};

const property = async request => {
    const property = await nftsRepository.findProperty(request.params.id, request.params.key);

    return respondWithResource(request, property, "nftProperty");
};

const search = async request => {
    const nfts = await nftsRepository.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(request, nfts, "nft");
};

export function registerMethods(server) {
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
}
