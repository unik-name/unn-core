/* tslint:disable:max-line-length */
import { IContainer } from "../../../packages/core-interfaces/src/core-container";
import { DiscloseDemandPayload, models } from "../../../packages/crypto";
import { TransactionFactory } from "../../helpers";
import "../../utils";
import { delegates } from "../../utils/fixtures/testnet/delegates";
import { buildDiscloseDemand } from "../../utils/helpers";
import { mintNft } from "./__support__/nft-utils";
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
    waitForNftMinted,
    waitForNftProperty,
} from "./__support__/utils";

let configManager;
let container: IContainer;
const mockCallback = jest.fn(() => true);

describe("Disclose Explicit transactions tests", () => {
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

    it("should disclose explicit value", async () => {
        // mint nft for demander
        let nextForger = await getNextForger();
        const demanderKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const demanderWallet = blockchain.database.walletManager.findByPublicKey(demanderKeys.publicKey);
        const demanderUnikId = await mintNft(blockchain, nextForger, {});
        await waitForNftMinted(demanderUnikId);

        // mint nft for issuer
        nextForger = await getNextForger();
        const issuerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const issuerUnikId = await mintNft(blockchain, nextForger, {});
        await waitForNftMinted(issuerUnikId);

        const discloseDemandPayload: DiscloseDemandPayload = {
            explicitValue: ["explicitValue1", "anotherExplicitValue"],
            sub: demanderUnikId,
            type: models.DIDTypes.INDIVIDUAL,
            iss: demanderUnikId,
            iat: 12345678,
        };
        const discloseDemand = buildDiscloseDemand(
            discloseDemandPayload,
            demanderKeys.passphrase,
            issuerUnikId,
            issuerKeys.passphrase,
        );

        // build disclose explicit transaction
        const discloseTransaction = TransactionFactory.unsDiscloseExplicit(discloseDemand)
            .withPassphrase(demanderKeys.passphrase)
            .create();

        nextForger = await getNextForger();
        const nextForgerWallet = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);
        const newBlock = createBlock(nextForgerWallet, discloseTransaction);
        await blockchain.processBlock(newBlock, mockCallback);

        // check nft presence
        expect(demanderWallet.tokens.length).toEqual(1);
        expect(demanderWallet.tokens[0]).toEqual(demanderUnikId);
        // check disclosed explicit values
        const nftExplicitValuesStr = discloseDemandPayload.explicitValue.join(",");
        const nftExplicitValues = await waitForNftProperty(demanderUnikId, {
            key: "explicitValues",
            val: nftExplicitValuesStr,
        });

        expect(nftExplicitValues.value).toEqual(nftExplicitValuesStr);
    });
});
