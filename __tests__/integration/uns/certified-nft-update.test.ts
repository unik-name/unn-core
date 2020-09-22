import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Container, Database } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Identities, Networks, Utils } from "@arkecosystem/crypto";
import * as NftSupport from "../../functional/transaction-forging/__support__/nft";
import * as Fixtures from "../../unit/uns-crypto/__fixtures__/index";
import genesisBlock from "../../utils/config/dalinet/genesisBlock.json";
import { tearDown } from "../core-transactions/__support__/setup";

let container: Container.IContainer;
let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;

beforeAll(async () => {
    container = await NftSupport.setUp();

    walletManager = new WalletManager();
    database = container.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
});

afterAll(tearDown);

describe("certifiedNftupdate handler tests", () => {
    const optionsDefault = {
        timestamp: 12345689,
        previousBlock: {
            id: genesisBlock.id,
            height: 1,
        },
        reward: Utils.BigNumber.ZERO,
    };
    let issuerWallet;
    let senderWallet;

    beforeEach(async () => {
        await database.reset();
        issuerWallet = new Wallets.Wallet(Fixtures.issuerAddress);
        issuerWallet.publicKey = Fixtures.issKeys.publicKey;
        walletManager.reindex(issuerWallet);

        senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(Fixtures.ownerPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(Fixtures.ownerPassphrase);
        walletManager.reindex(senderWallet);
    });

    it("wallet bootstrap for nft update transaction", async () => {
        const senderInitialBalance = Utils.BigNumber.make("200000000");
        senderWallet.balance = senderInitialBalance;
        walletManager.reindex(senderWallet);
        const transaction = Fixtures.buildUrlCheckerTransaction(
            { tokenId: Fixtures.issUnikId, address: Fixtures.issuerAddress, passphrase: Fixtures.issPassphrase },
            { tokenId: Fixtures.tokenId, address: senderWallet.address, passphrase: Fixtures.ownerPassphrase },
        );

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);
        const block = delegate.forge([transaction.data], optionsDefault);

        await database.connection.saveBlock(block);

        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(
            senderInitialBalance.minus(transaction.data.asset.certification.payload.cost).minus(transaction.data.fee),
        );

        // check forgeFactory balance
        expect(issuerWallet.balance).toEqual(Utils.BigNumber.make(transaction.data.amount));
        expect(issuerWallet.balance).toStrictEqual(transaction.data.asset.certification.payload.cost);
    });
});
