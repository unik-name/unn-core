/* tslint:disable:max-line-length */
import { IContainer } from "../../../packages/core-interfaces/src/core-container";
import { crypto, models, transactionBuilder } from "../../../packages/crypto";
import "../../utils";
import { delegates } from "../../utils/fixtures/testnet/delegates";
import { generateNftIdentifier } from "../../utils/generators/nft";
import { setUp, tearDown } from "./__support__/setup";

import { mintNft } from "./__support__/nft-utils";
import {
    __addBlocks,
    __resetBlocksInCurrentRound,
    __resetToHeight1,
    __start,
    blockchain,
    conditionnalTimeout,
    createBlock,
    genesisBlock,
    getNextForger,
} from "./__support__/utils";

const { Block } = models;

let configManager;
let container: IContainer;
const mockCallback = jest.fn(() => true);

describe("NFT transactions tests", () => {
    let logger;

    beforeAll(async () => {
        container = await setUp();

        // Backup logger.debug function as we are going to mock it in the test suite
        logger = container.resolvePlugin("logger");

        configManager = container.getConfig();

        // Workaround: Add genesis transactions to the exceptions list, because they have a fee of 0
        // and otherwise don't pass validation.
        configManager.set("exceptions.transactions", genesisBlock.transactions.map(tx => tx.id));

        // Manually register the blockchain and __start it
        await __start(container, false);
        await __resetToHeight1();
        await __resetBlocksInCurrentRound();
        await __addBlocks(155);
    });

    afterAll(async () => {
        configManager.set("exceptions.transactions", []);

        await __resetToHeight1();
        await __resetBlocksInCurrentRound();

        // Manually stop the blockchain
        await blockchain.stop();

        await tearDown();
    });

    const nftInitType = "1";

    it("should mint NFT", async () => {
        const nextForger = await getNextForger();
        const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
        const nftId = await mintNft(blockchain, nextForger, {});

        // Writing NFT in db is asynchronous event, so we have to wait for the new data to be written
        const nft = await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findById(nftId);
            },
            () => true,
            1000,
        );

        // check nft presence
        expect(walletForger.tokens.length).toEqual(1);
        expect(walletForger.tokens[0]).toEqual(nftId);

        // check nft attributes
        expect(nft.id).toEqual(nftId);
        expect(nft.ownerId).toEqual(crypto.getAddress(forgerKeys.publicKey));
    });

    it("should mint NFT with property", async () => {
        const nextForger = await getNextForger();
        const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
        const nftId = await mintNft(blockchain, nextForger, { type: nftInitType });

        const nft = await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findById(nftId);
            },
            () => true,
            1000,
        );

        // check nft presence
        expect(walletForger.tokens.length).toEqual(1);
        expect(walletForger.tokens[0]).toEqual(nftId);
        // check nft attributes
        expect(nft.id).toEqual(nftId);
        expect(nft.ownerId).toEqual(crypto.getAddress(forgerKeys.publicKey));

        // check property
        const nftType = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
        expect(nftType.value).toEqual(nftInitType);
    });

    it("should mint and transfer NFT", async () => {
        let nextForger = await getNextForger();
        const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
        const nftId = await mintNft(blockchain, nextForger, { type: nftInitType });

        await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findById(nftId);
            },
            () => true,
            1000,
        );

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
        // Check for nft property in receiver wallet
        const nftType = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
        expect(nftType.value).toEqual(nftInitType);
        // Check sender wallet empty
        expect(walletForger.tokens.length).toEqual(0);
        // Check nft owner
        const nft = await blockchain.database.nftsBusinessRepository.findById(nftId);
        expect(nft.ownerId).toEqual(wallet.address);
    });

    it("should uptade and add properties on minted NFT", async () => {
        let nextForger = await getNextForger();
        const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
        const nftId = await mintNft(blockchain, nextForger, { type: nftInitType });

        await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findById(nftId);
            },
            () => true,
            1000,
        );

        // add nft property
        const fooVal = "fooval";
        const lolVal = "lolval";
        const nftTypeUpdateVal = "23";
        const nftUpdate = transactionBuilder
            .nftUpdate(nftId)
            .fee(1)
            .properties({ type: nftTypeUpdateVal, fookey: fooVal, lolkey: lolVal })
            .senderPublicKey(forgerKeys.publicKey)
            .sign(forgerKeys.passphrase)
            .getStruct();

        nextForger = await getNextForger();
        const nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const newBlock = createBlock(nextForgerWallet, [nftUpdate]);
        await blockchain.processBlock(newBlock, mockCallback);

        // Apply property process is asynchronous events, so we have to wait for the new data to be written in db
        let nftProp = await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findProperty(nftId, "fookey");
            },
            res => {
                return res.value === fooVal;
            },
            1000,
        );

        // Check for nft property added
        expect(walletForger.tokens.length).toEqual(1);
        expect(nftProp.value).toEqual(fooVal);
        nftProp = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "type");
        expect(nftProp.value).toEqual(nftTypeUpdateVal);
        nftProp = await blockchain.database.nftsBusinessRepository.findProperty(nftId, "lolkey");
        expect(nftProp.value).toEqual(lolVal);
    });

    it("should remove property from minted NFT", async () => {
        let nextForger = await getNextForger();
        const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
        const nftId = await mintNft(blockchain, nextForger, { type: nftInitType });

        await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findById(nftId);
            },
            () => true,
            1000,
        );

        // add nft property
        const nftUpdate = transactionBuilder
            .nftUpdate(nftId)
            .properties({ type: null })
            .senderPublicKey(forgerKeys.publicKey)
            .sign(forgerKeys.passphrase)
            .getStruct();

        nextForger = await getNextForger();
        const nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const newBlock = createBlock(nextForgerWallet, [nftUpdate]);
        await blockchain.processBlock(newBlock, mockCallback);

        // Apply property process is asynchronous events, so we have to wait for the new data to be written in db
        const nftProps = await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findProperties(nftId);
            },
            res => {
                return res.count === 0;
            },
            1000,
        );
        // Check for nft property added
        expect(walletForger.tokens.length).toEqual(1);
        expect(nftProps.count).toEqual(0);
    });

    it("should remove unexisting property", async () => {
        let nextForger = await getNextForger();
        const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const walletForger = blockchain.database.walletManager.findByPublicKey(forgerKeys.publicKey);
        const nftId = await mintNft(blockchain, nextForger, { type: nftInitType });

        await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findById(nftId);
            },
            () => true,
            1000,
        );

        // add nft property
        const nftUpdate = transactionBuilder
            .nftUpdate(nftId)
            .properties({ unexistingPropertyKey: null })
            .senderPublicKey(forgerKeys.publicKey)
            .sign(forgerKeys.passphrase)
            .getStruct();

        nextForger = await getNextForger();
        const nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const newBlock = createBlock(nextForgerWallet, [nftUpdate]);
        await blockchain.processBlock(newBlock, mockCallback);

        // Apply property process is asynchronous events, so we have to wait for the new data to be written in db
        const nftProps = await conditionnalTimeout(
            nftId,
            async nftId => {
                return await blockchain.database.nftsBusinessRepository.findProperties(nftId);
            },
            res => {
                return res.count === 1;
            },
            1000,
        );
        // Check for nft property added
        expect(walletForger.tokens.length).toEqual(1);
        expect(nftProps.count).toEqual(1);
    });
});
