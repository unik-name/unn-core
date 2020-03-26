import { State } from "@arkecosystem/core-interfaces";
import { Enums } from "@arkecosystem/crypto";
import * as Hapi from "@hapi/hapi";
import { EXPLICIT_PROP_KEY, getNftsManager, getWalletManager } from "../handlers/utils/helpers";
import { isResponse } from "./utils";

export const registerPlugin = (server: Hapi.Server) => {
    if (server) {
        server.ext({
            type: "onPreResponse",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                if (isTransactionsRoute(request)) {
                    await handleRoute(request, handleTransactionsRoute);
                }
                return h.continue;
            },
        });
    }
};

const isTransactionsRoute = (request: Hapi.Request): boolean => {
    const { method, path } = request.route;
    return method === "get" && /^\/api\/transactions$/.test(path);
};

const handleRoute = async (request, handler) => {
    const response = request.response;
    if (isResponse(response)) {
        const source = response.source as any;
        source.data = await handler(source.data);
    }
};

const handleTransactionsRoute = async transactions => {
    const trxReducer = (transactions, trxInfos) => {
        transactions[trxInfos.id] = trxInfos.username;
        return transactions;
    };
    const votesTransactions = transactions
        .filter(transaction => isVoteTransaction(transaction))
        .map(transaction => {
            const vote = (transaction.asset.votes[0] as string).slice(1);
            return {
                id: transaction.id,
                username: (getWalletManager().findByPublicKey(vote) as State.IWallet).getAttribute("delegate.username"),
            };
        })
        .reduce(trxReducer, {});

    if (Object.keys(votesTransactions).length) {
        // Retrieve explicit values
        const explicitValuesBatch = await getExplicitValuesByUnik(Object.values(votesTransactions));
        return transactions.map(transaction => {
            const username = votesTransactions[transaction.id];
            addUniknameToApiItem(transaction, username, explicitValuesBatch);
            return transaction;
        });
    }

    return transactions;
};

const isVoteTransaction = transaction => {
    return (
        (transaction.typeGroup === Enums.TransactionTypeGroup.Core &&
            transaction.type === Enums.TransactionType.Vote) ||
        (transaction.type === 5 /*UnsVote*/ && transaction.typeGroup === 2001)
    );
};

const isUnikId = (username: string): boolean => {
    return /^[a-f0-9]+$/.test(username) && username.length === 64;
};

const addUniknameToApiItem = (item: any, username: string, batch: any[]) => {
    if (isUnikId(username)) {
        const explicitValues = batch.find(elt => elt.nftId === username).value;
        item.unikname = explicitValues.split(",")[0];
    }
};

const getExplicitValuesByUnik = async (ids: string[]) => {
    return await getNftsManager().getPropertyBatch(ids, EXPLICIT_PROP_KEY);
};
