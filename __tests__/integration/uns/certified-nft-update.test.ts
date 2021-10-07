import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres";
import { NftsRepository } from "@arkecosystem/core-database-postgres/dist/core-nft";
import { Delegate } from "@arkecosystem/core-forger/dist/delegate";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { WalletManager } from "@arkecosystem/core-state/dist/wallets";
import { Identities, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { DIDTypes, getRewardsFromDidType, LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades } from "@uns/crypto";
import { getFoundationWallet } from "@uns/uns-transactions/dist/handlers/utils/helpers";
import * as support from "../../functional/transaction-forging/__support__";
import * as NftSupport from "../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../helpers/nft-transaction-factory";
import * as Fixtures from "../../unit/uns-crypto/__fixtures__/index";
import genesisBlock from "../../utils/config/dalinet/genesisBlock.json";

let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;
let nftRepo: NftsRepository;

beforeAll(async () => {
    await NftSupport.setUp({ disableP2P: true });
    walletManager = new WalletManager();
    database = app.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
    nftRepo = (database.connection as any).db.nfts;
});

afterAll(async () => support.tearDown());

describe("certifiedNftupdate handler tests", () => {
    const optionsDefault = {
        timestamp: 12345689,
        previousBlock: {
            id: genesisBlock.id,
            height: 1,
        },
        reward: Utils.BigNumber.ZERO,
    };
    let issuerWallet: State.IWallet;
    let senderWallet: State.IWallet;
    const issuerPassphrase = "the issuer passphrase";
    const senderPassphrase = "the sender passphrase";

    beforeEach(async () => {
        await database.reset();
        issuerWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(issuerPassphrase));
        issuerWallet.publicKey = Identities.PublicKey.fromPassphrase(issuerPassphrase);
        issuerWallet.balance = Utils.BigNumber.ZERO;
        walletManager.reindex(issuerWallet);

        senderWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        senderWallet.balance = Utils.BigNumber.ZERO;
        walletManager.reindex(senderWallet);
    });

    it("wallet bootstrap for nft update transaction", async () => {
        const serviceCost = Utils.BigNumber.make(100000000);
        const senderInitialBalance = Utils.BigNumber.make(200000000);
        senderWallet.balance = senderInitialBalance;
        walletManager.reindex(senderWallet);
        const properties = {
            "Verified/URL/MyUrl": "https://www.toto.lol",
            "Verified/URL/MyUrl/proof":
                '{"iat":1598434813,"exp":1598694013,"jti":"SyjfEteA8tSAPRjV4b_lw","sig":"jwtSignature"}',
        };

        const transaction = NFTTransactionFactory.nftCertifiedUpdate(
            Fixtures.tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            issuerPassphrase,
            properties,
            serviceCost,
        ).build()[0];

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);
        const block = delegate.forge([transaction.data], optionsDefault);
        await database.connection.saveBlock(block);
        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(senderInitialBalance.minus(serviceCost).minus(transaction.data.fee));

        // check forgeFactory balance
        expect(issuerWallet.balance).toStrictEqual(serviceCost);
        expect(issuerWallet.balance).toStrictEqual(Utils.BigNumber.make(transaction.data.amount));
        expect(issuerWallet.balance).toStrictEqual(transaction.data.asset.certification.payload.cost);
    });

    it("tokeneco v2: wallet bootstrap for individual alive demand", async () => {
        // force v2 token Eco for blocks 1 & 2
        Managers.configManager.getMilestone().unsTokenEcoV2 = true;
        Managers.configManager.getMilestone(2).unsTokenEcoV2 = true;

        const didType = DIDTypes.INDIVIDUAL;
        senderWallet.setAttribute("tokens", { [Fixtures.tokenId]: { type: didType } });
        // needed for wallet boostrap integrity check
        jest.spyOn(nftRepo, "count").mockResolvedValueOnce(1);

        walletManager.reindex(senderWallet);
        const serviceCost = Utils.BigNumber.ZERO;
        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };

        const transaction = NFTTransactionFactory.nftCertifiedUpdate(
            Fixtures.tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            issuerPassphrase,
            properties,
            serviceCost,
        ).build()[0];

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);
        const block = delegate.forge([transaction.data], optionsDefault);
        await database.connection.saveBlock(block);
        await stateBuilder.run();

        const rewards = getRewardsFromDidType(didType);
        // check sender balance
        expect(senderWallet.balance).toEqual(Utils.BigNumber.make(rewards.sender));

        // check foundation balance
        const foundationWallet = getFoundationWallet(walletManager);
        expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.make(rewards.foundation));

        // check forgeFactory balance
        expect(issuerWallet.balance).toStrictEqual(serviceCost);
        expect(issuerWallet.balance).toEqual(Utils.BigNumber.make(transaction.data.amount));
        expect(issuerWallet.balance).toStrictEqual(transaction.data.asset.certification.payload.cost);
    });

    it("tokeneco v2: wallet bootstrap for organization alive demand", async () => {
        // force v2 token Eco for blocks 1 & 2
        Managers.configManager.getMilestone().unsTokenEcoV2 = true;
        Managers.configManager.getMilestone(2).unsTokenEcoV2 = true;

        const didType = DIDTypes.ORGANIZATION;
        const serviceCost = Utils.BigNumber.make(6666);
        const fee = 789465;
        senderWallet.setAttribute("tokens", { [Fixtures.tokenId]: { type: didType } });
        // needed for wallet boostrap integrity check
        jest.spyOn(nftRepo, "count").mockResolvedValueOnce(1);

        senderWallet.balance = Utils.BigNumber.make(fee).plus(serviceCost);
        walletManager.reindex(senderWallet);

        const foundationWallet = getFoundationWallet(walletManager);
        foundationWallet.balance = Utils.BigNumber.ZERO;
        walletManager.reindex(foundationWallet);

        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };

        const transaction = NFTTransactionFactory.nftCertifiedUpdate(
            Fixtures.tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            issuerPassphrase,
            properties,
            serviceCost,
            fee,
        ).build()[0];

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);
        const block = delegate.forge([transaction.data], optionsDefault);
        await database.connection.saveBlock(block);
        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);

        // check foundation balance
        expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);

        // check forgeFactory balance
        expect(issuerWallet.balance).toStrictEqual(serviceCost);
        expect(issuerWallet.balance).toEqual(Utils.BigNumber.make(transaction.data.amount));
        expect(issuerWallet.balance).toStrictEqual(transaction.data.asset.certification.payload.cost);
    });
});
