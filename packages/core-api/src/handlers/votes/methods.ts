import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const transactionsRepository = databaseService.transactionsBusinessRepository;

const index = async request => {
    const transactions = await transactionsRepository.findAllByType(5 /*UnsVote*/, {
        typeGroup: 2001,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(transactions, "transaction", (request.query.transform as unknown) as boolean);
};

const show = async request => {
    const transaction = await transactionsRepository.findByTypeAndId(5 /*UnsVote*/, request.params.id, 2001);

    if (!transaction) {
        return Boom.notFound("Vote not found");
    }

    return respondWithResource(transaction, "transaction", (request.query.transform as unknown) as boolean);
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.votes.index", index, 8, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.votes.show", show, 8, request => ({ ...{ id: request.params.id }, ...request.query }));
};
