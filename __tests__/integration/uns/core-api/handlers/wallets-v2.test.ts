import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Database } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Identities, Interfaces, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades, UnsTransactionType } from "@uns/crypto";
import { getFoundationWallet } from "@uns/uns-transactions/src/handlers/utils/helpers";
import * as support from "../../../../functional/transaction-forging/__support__";
import * as NftSupport from "../../../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../../../helpers/nft-transaction-factory";
import * as Fixtures from "../../../../unit/uns-crypto/__fixtures__";
import genesisBlock from "../../../../utils/config/dalinet/genesisBlock.json";
import { utils } from "../../../core-api/utils";

let stateBuilder: StateBuilder;
let walletManager;
let database: Database.IDatabaseService;

beforeAll(async () => {
    await NftSupport.setUp({
        disableP2P: true,
        disableApiCache: true,
    });

    database = app.resolvePlugin("database");
    walletManager = new WalletManager();
    stateBuilder = new StateBuilder(database.connection, walletManager);

    // force v2 token Eco
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.getMilestone().unsTokenEcoV2 = true;
});

afterAll(async () => support.tearDown());

describe("GET /wallets/:id/transactions", () => {
    it("should GET all the transactions containing rewards for the foundation Wallet", async () => {
        const tokenId = NftSupport.generateNftId();
        const voucherId = "theVoucher";

        const foundationWallet = getFoundationWallet(walletManager);
        const senderPassphrase = "senderPassphrase";
        const senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        walletManager.reindex(senderWallet);

        const mintProperties = {
            type: "1",
            UnikVoucherId: voucherId,
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
        };

        const mintTransaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            mintProperties,
            Utils.BigNumber.ZERO,
        ).createOne();
        let nonce = 0;
        const UpdateTransaction = NFTTransactionFactory.nftCertifiedUpdate(
            tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            {
                [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
            },
            Utils.BigNumber.ZERO,
        )
            .withNonce(Utils.BigNumber.make(++nonce))
            .createOne();

        const blockTime = Managers.configManager.getMilestone().blocktime;
        const blockReward = Utils.BigNumber.make(Managers.configManager.getMilestone().reward);

        const forgeOptions1 = {
            timestamp: blockTime,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: blockReward,
        };
        const delegate1 = new Delegate("delegate passphrase", Networks.dalinet.network);
        const block1 = delegate1.forge([mintTransaction, UpdateTransaction], forgeOptions1);

        await database.connection.saveBlock(block1);
        await database.connection.buildWallets();
        await stateBuilder.run();

        jest.spyOn(database, "getBlocksByHeight").mockResolvedValue([
            { timestamp: forgeOptions1.timestamp + blockTime } as Interfaces.IBlockData,
        ]);

        const transactions1 = await utils.request("GET", `wallets/${foundationWallet.address}/transactions`);
        // Only alive demand must be returned
        expect(transactions1).toBeSuccessfulResponse();
        expect(transactions1.data.data).toBeArray();
        expect(transactions1.data.data.length).toEqual(1);
        utils.expectTransaction(transactions1.data.data[0]);
        expect(transactions1.data.data[0].type).toEqual(UnsTransactionType.UnsCertifiedNftUpdate);

        const tokenId2 = NftSupport.generateNftId();
        const forgeOptions2 = {
            timestamp: forgeOptions1.timestamp + blockTime,
            previousBlock: {
                id: block1.data.id,
                height: block1.data.height,
            },
            reward: blockReward,
        };

        const mintTransaction2 = NFTTransactionFactory.nftCertifiedMint(
            tokenId2,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            mintProperties,
            Utils.BigNumber.ZERO,
        )
            .withNonce(Utils.BigNumber.make(++nonce))
            .createOne();

        const UpdateTransaction2 = NFTTransactionFactory.nftCertifiedUpdate(
            tokenId2,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            {
                [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
            },
            Utils.BigNumber.ZERO,
        )
            .withNonce(Utils.BigNumber.make(++nonce))
            .createOne();

        const delegate2 = new Delegate("delegate 2 passphrase", Networks.dalinet.network);
        const block2 = delegate2.forge([mintTransaction2, UpdateTransaction2], forgeOptions2);
        await database.connection.saveBlock(block2);
        await database.connection.buildWallets();
        await stateBuilder.run();

        const response = await utils.request("GET", `wallets/${foundationWallet.address}/transactions`);
        // Alive demand post tokenEcoV3 should not be returned
        expect(response).toBeSuccessfulResponse();
        expect(response.data.data).toBeArray();
        expect(response.data.data.length).toEqual(1);
        utils.expectTransaction(response.data.data[0]);
        expect(response.data.data[0].type).toEqual(UnsTransactionType.UnsCertifiedNftUpdate);
    });
});
