/* tslint:disable:max-line-length */
import delay from "delay";
import { IContainer } from "../../../packages/core-interfaces/src/core-container";
import { crypto, models, transactionBuilder } from "../../../packages/crypto";
import "../../utils";
import { delegates } from "../../utils/fixtures/testnet/delegates";
import { generateNftIdentifier } from "../../utils/generators/nft";
import { setUp, tearDown } from "./__support__/setup";

import {
    addBlocks,
    blockchain,
    createBlock,
    getNextForger,
    resetBlocksInCurrentRound,
    resetToHeight1,
    start,
} from "./utils";

const { Block } = models;

let genesisBlock;
let configManager;
let container: IContainer;
let loggerDebugBackup;
const mockCallback = jest.fn(() => true);

describe("Blockchain", () => {
    let logger;

    beforeAll(async () => {
        container = await setUp();

        // Backup logger.debug function as we are going to mock it in the test suite
        logger = container.resolvePlugin("logger");
        loggerDebugBackup = logger.debug;

        // Create the genesis block after the setup has finished or else it uses a potentially
        // wrong network config.
        genesisBlock = new Block(require("../../utils/config/testnet/genesisBlock.json"));

        configManager = container.getConfig();

        // Workaround: Add genesis transactions to the exceptions list, because they have a fee of 0
        // and otherwise don't pass validation.
        configManager.set("exceptions.transactions", genesisBlock.transactions.map(tx => tx.id));

        // Manually register the blockchain and start it
        await start(container, false);
        await resetToHeight1();
        await resetBlocksInCurrentRound();
        await addBlocks(155);
    });

    afterAll(async () => {
        configManager.set("exceptions.transactions", []);

        await resetToHeight1();
        await resetBlocksInCurrentRound();

        // Manually stop the blockchain
        await blockchain.stop();

        await tearDown();
    });

    describe("nft rollback", () => {
        const nftInitType = "1";

        const mintNft = async (nextForger): Promise<string> => {
            // Ceate new nft
            const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);

            const nftId = generateNftIdentifier();
            const mintNft = transactionBuilder
                .nftMint(nftId)
                .properties({ type: nftInitType })
                .sign(forgerKeys.passphrase)
                .getStruct();

            const mintBlock = createBlock(forgerKeys, [mintNft]);
            await blockchain.processBlock(mintBlock, mockCallback);

            // Apply property process is asynchronous events, so we have to wait for the new data to be written in db
            await checkPropertyTimeout(nftId, { key: "type", value: nftInitType }, 1000);

            // check nft presence
            expect(walletForger.tokens.length).toEqual(1);
            expect(walletForger.tokens[0]).toEqual(nftId);

            const nftType = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
            expect(nftType.value).toEqual(nftInitType);

            return nftId;
        };

        const checkPropertyTimeout = async (nftId, propertyPair, timeout): Promise<void> => {
            let cnt = 0;
            while (cnt < timeout) {
                const nftType = await blockchain.database.nftsBusinessRepository.findProperty(nftId, propertyPair.key);
                if (nftType && nftType.value === propertyPair.value) {
                    return;
                }
                await delay(10);
                cnt += 10;
            }
        };

        afterEach(async () => {
            // Restore original logger.debug function
            logger.debug = loggerDebugBackup;
        });

        it("should transfer nft then rollback ", async () => {
            let nextForger = await getNextForger();
            const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
            const nftId = await mintNft(nextForger);

            const keyPair = crypto.getKeys("secret");
            const recipient = crypto.getAddress(keyPair.publicKey);
            const wallet = blockchain.database.walletManager.findByPublicKey(keyPair.publicKey);

            // Transfer Nft
            const nftTransfer = transactionBuilder
                .nftTransfer(nftId)
                .recipientId(recipient)
                .sign(forgerKeys.passphrase)
                .getStruct();

            nextForger = await getNextForger();
            const nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const newBlock = createBlock(nextForgerWallet, [nftTransfer]);
            await blockchain.processBlock(newBlock, mockCallback);

            // Check for nft presence in receiver wallet
            expect(wallet.tokens.length).toEqual(1);
            expect(wallet.tokens[0]).toEqual(nftId);
            const nftType = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
            expect(nftType.value).toEqual(nftInitType);
            expect(walletForger.tokens.length).toEqual(0);
            let nft = await blockchain.database.nftsBusinessRepository.findById(nftId);
            expect(nft.ownerId).toEqual(wallet.address);

            // Rewind 1 blocks back
            await blockchain.removeBlocks(1);
            expect(wallet.tokens.length).toEqual(0);
            expect(walletForger.tokens.length).toEqual(1);
            nft = await blockchain.database.nftsBusinessRepository.findById(nftId);
            expect(nft.ownerId).toEqual(walletForger.address);
        });

        it("should add and update nft property then rollback ", async () => {
            let nextForger = await getNextForger();
            const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
            const nftId = await mintNft(nextForger);

            // add nft property
            const nftPropValue = "tatapwet";
            const nftUpdate = transactionBuilder
                .nftUpdate(nftId)
                .fee(1)
                .properties({ type: "23", trololol: nftPropValue })
                .senderPublicKey(forgerKeys.publicKey)
                .sign(forgerKeys.passphrase)
                .getStruct();

            nextForger = await getNextForger();
            const nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const newBlock = createBlock(nextForgerWallet, [nftUpdate]);
            await blockchain.processBlock(newBlock, mockCallback);

            // Check for nft property added
            // Apply property process is asynchronous events, so we have to wait for the new data to be written in db
            await checkPropertyTimeout(nftId, { key: "trololol", value: nftPropValue }, 1000);
            let nftProp = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "trololol");
            expect(walletForger.tokens.length).toEqual(1);
            expect(nftProp.value).toEqual(nftPropValue);

            // Rewind 1 blocks back
            await blockchain.removeBlocks(1);
            // The revert property process is asynchronous, so we have to wait for the new data to be written in db
            await checkPropertyTimeout(nftId, { key: "type", value: nftInitType }, 1000);
            expect(walletForger.tokens.length).toEqual(1);
            nftProp = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "trololol");
            expect(nftProp).toBeNull();
            nftProp = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
            expect(nftProp.value).toEqual(nftInitType);
        });

        it("should remove nft property then rollback ", async () => {
            let nextForger = await getNextForger();
            const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
            const nftId = await mintNft(nextForger);

            // remove nft property
            const nftUpdate = transactionBuilder
                .nftUpdate(nftId)
                .fee(1)
                .properties({ type: null, witness: "done" })
                .senderPublicKey(forgerKeys.publicKey)
                .sign(forgerKeys.passphrase)
                .getStruct();

            nextForger = await getNextForger();
            const nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
            const newBlock = createBlock(nextForgerWallet, [nftUpdate]);
            await blockchain.processBlock(newBlock, mockCallback);

            // Check for nft property deleted
            // The apply property process is asynchronous, so we have to wait for the new data to be written in db
            await checkPropertyTimeout(nftId, { key: "witness", value: "done" }, 1000);
            expect(walletForger.tokens.length).toEqual(1);
            let nftProp = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
            expect(nftProp).toBeNull();

            // Rewind 1 blocks back
            await blockchain.removeBlocks(1);

            // The revert property process is asynchronous, so we have to wait for the new data to be written in db
            await checkPropertyTimeout(nftId, { key: "type", value: nftInitType }, 1000);
            expect(walletForger.tokens.length).toEqual(1);
            nftProp = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
            expect(nftProp.value).toEqual(nftInitType);
        });
    });
});
