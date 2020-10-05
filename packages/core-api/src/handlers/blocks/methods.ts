import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Managers, Utils } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import { getTokenId } from "@uns/core-nft-crypto";
import {
    DIDTypes,
    getDidType,
    getRewardsFromDidType,
    hasVoucher,
    isAliveDemand,
    UnsTransactionGroup,
    UnsTransactionType,
} from "@uns/crypto";
import { ServerCache } from "../../services";
import { paginate, respondWithResource, toPagination } from "../utils";

const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
const blocksRepository = databaseService.blocksBusinessRepository;
const transactionsRepository = databaseService.transactionsBusinessRepository;

const index = async request => {
    const blocks = await blocksRepository.search({
        ...request.query,
        ...paginate(request),
    });

    return toPagination(blocks, "block", request.query.transform);
};

const show = async request => {
    const block = await blocksRepository.findByIdOrHeight(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    if (block.numberOfTransactions) {
        const transactions: Database.ITransactionsPaginated = await transactionsRepository.findAllByBlock(block.id);
        const milestone = Managers.configManager.getMilestone(block.height);
        let unikMintRewards = Utils.BigNumber.ZERO;
        let foundationRewards = Utils.BigNumber.ZERO;
        for (const transaction of transactions.rows) {
            if (milestone.unsTokenEcoV2) {
                if (
                    transaction.type === UnsTransactionType.UnsCertifiedNftMint &&
                    transaction.typeGroup === UnsTransactionGroup &&
                    hasVoucher(transaction.asset)
                ) {
                    const didType = getDidType(transaction.asset);
                    if (didType !== DIDTypes.INDIVIDUAL) {
                        const rewards = getRewardsFromDidType(didType, block.height);
                        unikMintRewards = unikMintRewards
                            .plus(Utils.BigNumber.make(rewards.sender))
                            .plus(Utils.BigNumber.make(rewards.forger));
                        foundationRewards = Utils.BigNumber.make(rewards.foundation);
                    }
                } else if (
                    transaction.type === UnsTransactionType.UnsCertifiedNftUpdate &&
                    transaction.typeGroup === UnsTransactionGroup &&
                    isAliveDemand(transaction.asset)
                ) {
                    const sender: State.IWallet = databaseService.walletManager.findByPublicKey(
                        transaction.senderPublicKey,
                    );
                    const tokenId = getTokenId(transaction.asset);
                    const didType = sender.getAttribute("tokens")[tokenId].type;
                    if (didType === DIDTypes.INDIVIDUAL) {
                        const rewards = getRewardsFromDidType(didType, block.height);
                        unikMintRewards = unikMintRewards
                            .plus(Utils.BigNumber.make(rewards.sender))
                            .plus(Utils.BigNumber.make(rewards.forger));
                        foundationRewards = Utils.BigNumber.make(rewards.foundation);
                    }
                }
            } else if (
                transaction.type === UnsTransactionType.UnsCertifiedNftMint &&
                transaction.typeGroup === UnsTransactionGroup &&
                hasVoucher(transaction.asset)
            ) {
                const didType = getDidType(transaction.asset);
                const rewards = getRewardsFromDidType(didType, block.height);
                unikMintRewards = unikMintRewards
                    .plus(Utils.BigNumber.make(rewards.sender))
                    .plus(Utils.BigNumber.make(rewards.forger));
                foundationRewards = Utils.BigNumber.make(rewards.foundation);
            }
        }
        (block as any).unikMintRewards = unikMintRewards;
        (block as any).foundationRewards = foundationRewards;
    }

    return respondWithResource(block, "block", request.query.transform);
};

const transactions = async request => {
    const block = await blocksRepository.findByIdOrHeight(request.params.id);

    if (!block) {
        return Boom.notFound("Block not found");
    }

    const rows = await transactionsRepository.findAllByBlock(block.id, {
        ...request.query,
        ...paginate(request),
    });

    return toPagination(rows, "transaction", request.query.transform);
};

const search = async request => {
    const blocks = await blocksRepository.search({
        ...request.payload,
        ...request.query,
        ...paginate(request),
    });

    return toPagination(blocks, "block", request.query.transform);
};

export const registerMethods = server => {
    ServerCache.make(server)
        .method("v2.blocks.index", index, 6, request => ({
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.blocks.show", show, 600, request => ({ ...{ id: request.params.id }, ...request.query }))
        .method("v2.blocks.transactions", transactions, 600, request => ({
            ...{ id: request.params.id },
            ...request.query,
            ...paginate(request),
        }))
        .method("v2.blocks.search", search, 30, request => ({
            ...request.payload,
            ...request.query,
            ...paginate(request),
        }));
};
