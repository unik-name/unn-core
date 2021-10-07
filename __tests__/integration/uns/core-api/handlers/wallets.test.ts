import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Database } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Identities, Networks, Utils } from "@arkecosystem/crypto";
import { LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades, UnsTransactionType } from "@uns/crypto";
import { getFoundationWallet } from "@uns/uns-transactions/src/handlers/utils/helpers";
import * as support from "../../../../functional/transaction-forging/__support__";
import * as NftSupport from "../../../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../../../helpers/nft-transaction-factory";
import * as Fixtures from "../../../../unit/uns-crypto/__fixtures__/";
import genesisBlock from "../../../../utils/config/dalinet/genesisBlock.json";
import { utils } from "../../../core-api/utils";

let stateBuilder: StateBuilder;
let walletManager;
let database: Database.IDatabaseService;

beforeAll(async () => {
    await NftSupport.setUp({ disableP2P: true });
    database = app.resolvePlugin("database");
    walletManager = new WalletManager();
    stateBuilder = new StateBuilder(database.connection, walletManager);

    const nftRepo = (database.connection as any).db.nfts;
    // needed for wallet boostrap integrity check
    jest.spyOn(nftRepo, "count").mockResolvedValue(1);
});
afterAll(async () => support.tearDown());

describe("GET /wallets/:id/transactions", () => {
    it("should GET all the transactions containing rewards for the foundation Wallet", async () => {
        const tokenId = NftSupport.generateNftId();
        const voucherId = "theVoucher";

        const senderPassphrase = "senderPassphrase";
        const senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        walletManager.reindex(senderWallet);

        const properties = {
            type: "1",
            UnikVoucherId: voucherId,
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };

        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            Utils.BigNumber.ZERO,
        ).createOne();

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);

        const forgeOptions = {
            timestamp: 12345689,
            previousBlock: {
                id: genesisBlock.id,
                height: 1,
            },
            reward: Utils.BigNumber.ZERO,
        };
        const block = delegate.forge([transaction], forgeOptions);
        await database.connection.saveBlock(block);
        await database.connection.buildWallets();
        await stateBuilder.run();

        const foundationWallet = getFoundationWallet(walletManager);
        const response = await utils.request("GET", `wallets/${foundationWallet.address}/transactions`);
        expect(response).toBeSuccessfulResponse();
        expect(response.data.data).toBeArray();
        expect(response.data.data.length).toEqual(1);
        utils.expectTransaction(response.data.data[0]);
        expect(response.data.data[0].type).toEqual(UnsTransactionType.UnsCertifiedNftMint);
    });
});
