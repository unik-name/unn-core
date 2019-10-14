/* tslint:disable:max-line-length */
import { Wallet } from "@arkecosystem/core-database";
import { roundCalculator } from "@arkecosystem/core-utils";
import {
    Bignum,
    crypto,
    HashAlgorithms,
    ITransactionData,
    models,
    slots,
    sortTransactions,
} from "@arkecosystem/crypto";
import { asValue } from "awilix";
import delay from "delay";
import { defaults } from "../../../../packages/core-blockchain/src/defaults";
import "../../../utils";
import { blocks101to155 } from "../../../utils/fixtures/testnet/blocks101to155";
import { blocks2to100 } from "../../../utils/fixtures/testnet/blocks2to100";

const { Block } = models;

// tslint:disable-next-line:no-var-requires
export const genesisBlock = new Block(require("../../../utils/config/testnet/genesisBlock.json"));

export let blockchain;

export async function __start(container, networkStart) {
    process.env.CORE_SKIP_BLOCKCHAIN = "false";
    process.env.CORE_SKIP_PEER_STATE_VERIFICATION = "true";
    process.env.CORE_ENV = "false";

    // tslint:disable-next-line:no-var-requires
    const plugin = require("../../../../packages/core-blockchain/src").plugin;

    blockchain = await plugin.register(container, {
        networkStart,
        ...defaults,
    });

    await container.register(
        "blockchain",
        asValue({
            name: "blockchain",
            version: "0.1.0",
            plugin: blockchain,
            options: {},
        }),
    );

    if (networkStart) {
        return;
    }

    await __resetToHeight1();

    await blockchain.start();
    await __addBlocks(5);
}

export async function __resetBlocksInCurrentRound() {
    await blockchain.database.loadBlocksFromCurrentRound();
}

export async function __resetToHeight1() {
    const lastBlock = await blockchain.database.getLastBlock();
    if (lastBlock) {
        // Make sure the wallet manager has been fed or else revertRound
        // cannot determine the previous delegates. This is only necessary, because
        // the database is not dropped after the unit tests are done.
        await blockchain.database.buildWallets();

        // Index the genesis wallet or else revert block at height 1 fails
        const generator = crypto.getAddress(genesisBlock.data.generatorPublicKey);
        const genesis = new Wallet(generator);
        genesis.publicKey = genesisBlock.data.generatorPublicKey;
        genesis.username = "genesis";
        blockchain.database.walletManager.reindex(genesis);

        blockchain.state.clear();

        blockchain.state.setLastBlock(lastBlock);
        await __resetBlocksInCurrentRound();
        await blockchain.removeBlocks(lastBlock.data.height - 1);
    }
}

export async function __addBlocks(untilHeight) {
    const allBlocks = [...blocks2to100, ...blocks101to155];
    const lastHeight = blockchain.getLastHeight();

    for (let height = lastHeight + 1; height < untilHeight && height < 155; height++) {
        const blockToProcess = new Block(allBlocks[height - 2]);
        await blockchain.processBlock(blockToProcess, () => null);
    }
}

export const getNextForger = async () => {
    const lastBlock = blockchain.state.getLastBlock();
    const roundInfo = roundCalculator.calculateRound(lastBlock.data.height);
    const activeDelegates = await blockchain.database.getActiveDelegates(roundInfo);
    const nextSlot = slots.getSlotNumber(lastBlock.data.timestamp) + 1;
    return activeDelegates[nextSlot % activeDelegates.length];
};

export const createBlock = (generatorKeys: any, transactions: ITransactionData[]) => {
    const transactionData = {
        amount: Bignum.ZERO,
        fee: Bignum.ZERO,
        ids: [],
    };

    const sortedTransactions = sortTransactions(transactions);
    sortedTransactions.forEach(transaction => {
        transactionData.amount = transactionData.amount.plus(transaction.amount);
        transactionData.fee = transactionData.fee.plus(transaction.fee);
        transactionData.ids.push(Buffer.from(transaction.id, "hex"));
    });

    const lastBlock = blockchain.state.getLastBlock();
    const data = {
        timestamp: slots.getSlotTime(slots.getSlotNumber(lastBlock.data.timestamp) + 1),
        version: 0,
        previousBlock: lastBlock.data.id,
        previousBlockHex: lastBlock.data.idHex,
        height: lastBlock.data.height + 1,
        numberOfTransactions: sortedTransactions.length,
        totalAmount: transactionData.amount,
        totalFee: transactionData.fee,
        reward: Bignum.ZERO,
        payloadLength: 32 * sortedTransactions.length,
        payloadHash: HashAlgorithms.sha256(transactionData.ids).toString("hex"),
        transactions: sortedTransactions,
    };

    return Block.create(data, crypto.getKeys(generatorKeys.secret));
};

export const conditionnalTimeout = async (nftId, checkFunction, resCondition, timeout): Promise<any> => {
    let cnt = 0;
    while (cnt < timeout) {
        const res = await checkFunction(nftId);
        if (res && resCondition(res)) {
            return res;
        }
        await delay(10);
        cnt += 10;
    }
};
