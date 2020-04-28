import { State } from "@arkecosystem/core-interfaces";
import { delegateCalculator, formatTimestamp } from "@arkecosystem/core-utils";
import { DIDHelpers } from "@uns/crypto";

export const transformDelegate = (delegate: State.IWallet) => {
    const attributes: State.IWalletDelegateAttributes = delegate.getAttribute("delegate");

    let type = "genesis";
    if (attributes.type) {
        type = DIDHelpers.fromCode(attributes.type).toLowerCase();
    }
    let voteBalance = attributes.voteBalance;
    if (attributes?.weightedVoteBalance) {
        voteBalance = attributes.weightedVoteBalance;
    }
    const data = {
        username: attributes.username,
        type,
        address: delegate.address,
        publicKey: delegate.publicKey,
        votes: voteBalance.toFixed(),
        rank: attributes.rank,
        isResigned: !!attributes.resigned,
        blocks: {
            produced: attributes.producedBlocks,
        },
        production: {
            approval: attributes.approval,
        },
        forged: {
            fees: attributes.forgedFees.toFixed(),
            rewards: attributes.forgedRewards.toFixed(),
            total: delegateCalculator.calculateForgedTotal(delegate),
        },
    };

    const lastBlock = attributes.lastBlock;

    if (lastBlock) {
        // @ts-ignore
        data.blocks.last = {
            id: lastBlock.id,
            height: lastBlock.height,
            timestamp: formatTimestamp(lastBlock.timestamp),
        };
    }

    return data;
};
