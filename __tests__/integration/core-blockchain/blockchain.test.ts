/* tslint:disable:max-line-length */
import delay from "delay";
import { roundCalculator } from "../../../packages/core-utils";
import { Bignum, crypto, models, transactionBuilder } from "../../../packages/crypto";
import "../../utils";
import { delegates } from "../../utils/fixtures/testnet/delegates";
import { setUp, tearDown } from "./__support__/setup";
import {
    __addBlocks,
    __resetBlocksInCurrentRound,
    __resetToHeight1,
    __start,
    blockchain,
    createBlock,
    genesisBlock,
    getNextForger,
} from "./__support__/utils";

const { Block } = models;

let configManager;
let container;
let loggerDebugBackup;

describe("Blockchain", () => {
    let logger;
    beforeAll(async () => {
        container = await setUp();

        // Backup logger.debug function as we are going to mock it in the test suite
        logger = container.resolvePlugin("logger");
        loggerDebugBackup = logger.debug;

        configManager = container.getConfig();

        // Workaround: Add genesis transactions to the exceptions list, because they have a fee of 0
        // and otherwise don't pass validation.
        configManager.set("exceptions.transactions", genesisBlock.transactions.map(tx => tx.id));

        // Manually register the blockchain and start it
        await __start(container, false);
    });

    afterAll(async () => {
        configManager.set("exceptions.transactions", []);

        await __resetToHeight1();

        // Manually stop the blockchain
        await blockchain.stop();

        await tearDown();
    });

    afterEach(async () => {
        // Restore original logger.debug function
        logger.debug = loggerDebugBackup;

        await __resetToHeight1();
        await __addBlocks(5);
        await __resetBlocksInCurrentRound();
    });

    describe("postTransactions", () => {
        it("should be ok", async () => {
            const transactionsWithoutType2 = genesisBlock.transactions.filter(tx => tx.type !== 2);

            blockchain.transactionPool.flush();
            await blockchain.postTransactions(transactionsWithoutType2);
            const transactions = await blockchain.transactionPool.getTransactions(0, 200);

            expect(transactions.length).toBe(transactionsWithoutType2.length);

            expect(transactions).toEqual(transactionsWithoutType2.map(transaction => transaction.serialized));

            blockchain.transactionPool.flush();
        });
    });

    describe("removeBlocks", () => {
        it("should remove blocks", async () => {
            const lastBlockHeight = blockchain.getLastBlock().data.height;

            await blockchain.removeBlocks(2);
            expect(blockchain.getLastBlock().data.height).toBe(lastBlockHeight - 2);
        });

        it("should remove (current height - 1) blocks if we provide a greater value", async () => {
            await __resetToHeight1();

            await blockchain.removeBlocks(9999);
            expect(blockchain.getLastBlock().data.height).toBe(1);
        });
    });

    describe("removeTopBlocks", () => {
        it("should remove top blocks", async () => {
            const dbLastBlockBefore = await blockchain.database.getLastBlock();
            const lastBlockHeight = dbLastBlockBefore.data.height;

            await blockchain.removeTopBlocks(2);
            const dbLastBlockAfter = await blockchain.database.getLastBlock();

            expect(dbLastBlockAfter.data.height).toBe(lastBlockHeight - 2);
        });
    });

    describe("restoreCurrentRound", () => {
        it("should restore the active delegates of the current round", async () => {
            await __resetToHeight1();

            // Go to arbitrary height in round 2.
            await __addBlocks(55);

            // Pretend blockchain just started
            const roundInfo = roundCalculator.calculateRound(blockchain.getLastHeight());
            await blockchain.database.restoreCurrentRound(blockchain.getLastHeight());
            const forgingDelegates = await blockchain.database.getActiveDelegates(roundInfo);
            expect(forgingDelegates).toHaveLength(51);

            // Reset again and replay to round 2. In both cases the forging delegates
            // have to match.
            await __resetToHeight1();
            await __addBlocks(52);

            // FIXME: using jest.spyOn getActiveDelegates with toHaveLastReturnedWith() somehow gets
            // overwritten in afterEach
            // FIXME: wallet.lastBlock needs to be properly restored when reverting
            forgingDelegates.forEach(forger => (forger.lastBlock = null));
            expect(forgingDelegates).toEqual(
                (blockchain.database as any).forgingDelegates.map(forger => {
                    forger.lastBlock = null;
                    return forger;
                }),
            );
        });
    });

    describe("rollback", () => {
        beforeEach(async () => {
            await __resetToHeight1();
            await __addBlocks(155);
        });

        it("should restore vote balances after a rollback", async () => {
            const mockCallback = jest.fn(() => true);

            // Create key pair for new voter
            const keyPair = crypto.getKeys("secret");
            const recipient = crypto.getAddress(keyPair.publicKey);

            let nextForger = await getNextForger();
            const initialVoteBalance = nextForger.voteBalance;

            // First send funds to new voter wallet
            const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const transfer = transactionBuilder
                .transfer()
                .recipientId(recipient)
                .amount(125)
                .sign(forgerKeys.passphrase)
                .getStruct();

            const transferBlock = createBlock(forgerKeys, [transfer]);
            await blockchain.processBlock(transferBlock, mockCallback);

            const wallet = blockchain.database.walletManager.findByPublicKey(keyPair.publicKey);
            const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);

            // New wallet received funds and vote balance of delegate has been reduced by the same amount,
            // since it forged it's own transaction the fees for the transaction have been recovered.
            expect(wallet.balance).toEqual(new Bignum(transfer.amount));
            expect(walletForger.voteBalance).toEqual(new Bignum(initialVoteBalance).minus(transfer.amount));

            // Now vote with newly created wallet for previous forger.
            const vote = transactionBuilder
                .vote()
                .fee(1)
                .votesAsset([`+${forgerKeys.publicKey}`])
                .sign("secret")
                .getStruct();

            nextForger = await getNextForger();
            let nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);

            const voteBlock = createBlock(nextForgerWallet, [vote]);
            await blockchain.processBlock(voteBlock, mockCallback);

            // Wallet paid a fee of 1 and the vote has been placed.
            expect(wallet.balance).toEqual(new Bignum(124));
            expect(wallet.vote).toEqual(forgerKeys.publicKey);

            // Vote balance of delegate now equals initial vote balance minus 1 for the vote fee
            // since it was forged by a different delegate.
            expect(walletForger.voteBalance).toEqual(new Bignum(initialVoteBalance).minus(vote.fee));

            // Now unvote again
            const unvote = transactionBuilder
                .vote()
                .fee(1)
                .votesAsset([`-${forgerKeys.publicKey}`])
                .sign("secret")
                .getStruct();

            nextForger = await getNextForger();
            nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);

            const unvoteBlock = createBlock(nextForgerWallet, [unvote]);
            await blockchain.processBlock(unvoteBlock, mockCallback);

            // Wallet paid a fee of 1 and no longer voted a delegate
            expect(wallet.balance).toEqual(new Bignum(123));
            expect(wallet.vote).toBeNull();

            // Vote balance of delegate now equals initial vote balance minus the amount sent to the voter wallet.
            expect(walletForger.voteBalance).toEqual(new Bignum(initialVoteBalance).minus(transfer.amount));

            // Now rewind 3 blocks back to the initial state
            await blockchain.removeBlocks(3);

            // Wallet is now a cold wallet and the initial vote balance has been restored.
            expect(wallet.balance).toEqual(Bignum.ZERO);
            expect(walletForger.voteBalance).toEqual(new Bignum(initialVoteBalance));
        });
    });

    describe("getUnconfirmedTransactions", () => {
        it("should get unconfirmed transactions", async () => {
            const transactionsWithoutType2 = genesisBlock.transactions.filter(tx => tx.type !== 2);

            blockchain.transactionPool.flush();
            await blockchain.postTransactions(transactionsWithoutType2);
            const unconfirmedTransactions = await blockchain.getUnconfirmedTransactions(200);

            expect(unconfirmedTransactions.transactions.length).toBe(transactionsWithoutType2.length);

            expect(unconfirmedTransactions.transactions).toEqual(
                transactionsWithoutType2.map(transaction => transaction.serialized.toString("hex")),
            );

            blockchain.transactionPool.flush();
        });

        it("should return object with count == -1 if getTransactionsForForging returned a falsy value", async () => {
            jest.spyOn(blockchain.transactionPool, "getTransactionsForForging").mockReturnValueOnce(null);

            const unconfirmedTransactions = await blockchain.getUnconfirmedTransactions(200);
            expect(unconfirmedTransactions.count).toBe(-1);
        });
    });

    describe("stop on emit shutdown", () => {
        it("should trigger the stop method when receiving 'shutdown' event", async () => {
            const emitter = container.resolvePlugin("event-emitter");

            // @ts-ignore
            const stop = jest.spyOn(blockchain, "stop").mockReturnValue(true);

            emitter.emit("shutdown");

            await delay(200);

            expect(stop).toHaveBeenCalled();
        });
    });
});
