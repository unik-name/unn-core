import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Database } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Identities, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { UNSCertifiedNftMintBuilder } from "@uns/crypto";
import * as support from "../../../../functional/transaction-forging/__support__";
import * as NftSupport from "../../../../functional/transaction-forging/__support__/nft";
import { TransactionFactory } from "../../../../helpers";
import * as Fixtures from "../../../../unit/uns-crypto/__fixtures__/";
import { buildCertifiedDemand } from "../../../../unit/uns-crypto/helpers";
import genesisBlock from "../../../../utils/config/dalinet/genesisBlock.json";
import { utils } from "../../../core-api/utils";

let stateBuilder: StateBuilder;
let walletManager;
let database: Database.IDatabaseService;

beforeAll(async () => {
    await NftSupport.setUp();
    database = app.resolvePlugin("database");
    walletManager = new WalletManager();
    stateBuilder = new StateBuilder(database.connection, walletManager);
});
afterAll(support.tearDown);

describe("GET /wallets/:id/transactions", () => {
    it("should GET all the transactions for the foundation Wallet", async () => {
        const tokenId = "a99ee098dd4fd00ba513e1ca09abb8522a8ba94fa2a7a81dd674eac27ce66b94";
        const voucherId = "theVoucher";

        const senderPassphrase = "senderPassphrase";
        const senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        walletManager.reindex(senderWallet);

        const foundationPubKey = Managers.configManager.get("network.foundation.publicKey");
        const foundationAddress = Identities.Address.fromPublicKey(foundationPubKey);
        const foundationWallet = walletManager.findByAddress(foundationAddress);
        foundationWallet.publicKey = foundationPubKey;
        walletManager.reindex(foundationWallet);

        const properties = {
            type: "1",
            UnikVoucherId: voucherId,
        };

        const demand = buildCertifiedDemand(tokenId, properties, senderPassphrase);

        const transaction = new TransactionFactory(
            new UNSCertifiedNftMintBuilder("unik", tokenId)
                .properties(properties)
                .demand(demand.demand)
                .certification(demand.certification, Fixtures.issuerAddress),
        )
            .withNetwork(NftSupport.network)
            .withPassphrase(senderPassphrase)
            .createOne();

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

        const response = await utils.request("GET", `wallets/${foundationAddress}/transactions`);
        expect(response).toBeSuccessfulResponse();
        expect(response.data.data).toBeArray();
        expect(response.data.data.length).toEqual(1);
        utils.expectTransaction(response.data.data[0]);
    });
});
