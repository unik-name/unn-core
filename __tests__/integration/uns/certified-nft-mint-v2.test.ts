import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Database, State } from "@arkecosystem/core-interfaces";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Identities, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { nftRepository, NftsManager } from "@uns/core-nft";
import { DIDTypes, getRewardsFromDidType, IUnsRewards, LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades } from "@uns/crypto";
import { getFoundationWallet } from "@uns/uns-transactions/src/handlers/utils/helpers";
import * as support from "../../functional/transaction-forging/__support__";
import * as NftSupport from "../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../helpers/nft-transaction-factory";
import * as Fixtures from "../../unit/uns-crypto/__fixtures__/index";
import genesisBlock from "../../utils/config/dalinet/genesisBlock.json";
import { formatProperties } from "./utils";

let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;
const tokenId = NftSupport.generateNftId();
let nftManager: NftsManager;

beforeAll(async () => {
    await NftSupport.setUp({
        disableP2P: true,
        forgeFactoryUnikId: Fixtures.issUnikId,
        forgeFactoryPassphrase: Fixtures.issPassphrase,
    });

    // force v2 token Eco
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.getMilestone().unsTokenEcoV2 = true;

    walletManager = new WalletManager();
    database = app.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
    nftManager = app.resolvePlugin<NftsManager>("core-nft");
});

afterAll(async () => support.tearDown());

describe("certifiedNftMint handler tests for token eco v2", () => {
    const optionsDefault = {
        timestamp: 12345689,
        previousBlock: {
            id: genesisBlock.id,
            height: 1,
        },
        reward: Utils.BigNumber.ZERO,
    };
    const passphrase = "thisIsAPassphrase";
    let forgeFactoryWallet: State.IWallet;
    let senderWallet: State.IWallet;

    beforeEach(async () => {
        await database.reset();

        forgeFactoryWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(Fixtures.issPassphrase));
        forgeFactoryWallet.publicKey = Fixtures.issKeys.publicKey;
        walletManager.reindex(forgeFactoryWallet);

        senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(passphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
        walletManager.reindex(senderWallet);
    });

    it("wallet bootstrap for mint transaction", async () => {
        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
            type: DIDTypes.INDIVIDUAL.toString(),
        };
        const serviceCost = Utils.BigNumber.make(654321);
        const fee = 12345;
        senderWallet.balance = Utils.BigNumber.make(fee).plus(serviceCost);
        walletManager.reindex(senderWallet);

        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            fee,
        ).createOne();

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);

        const block = delegate.forge([transaction], optionsDefault);

        await database.connection.saveBlock(block);

        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);

        // check forgeFactory balance
        expect(forgeFactoryWallet.balance).toEqual(serviceCost);

        expect(Object.keys(senderWallet.getAttribute("tokens")).includes(tokenId)).toBeTrue();
        expect(await nftManager.exists(tokenId)).toBeTrue();

        expect(await nftRepository().findProperties(tokenId)).toEqual(formatProperties(properties));
    });

    it("wallet bootstrap for individual mint transaction with voucher", async () => {
        const voucherId = "6trg50ZxgEPl9Av8V67c0";
        const serviceCost = Utils.BigNumber.ZERO;
        const fee = 0;
        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
            UnikVoucherId: voucherId,
            type: DIDTypes.INDIVIDUAL.toString(),
        };
        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            fee,
        ).createOne();

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);

        const block = delegate.forge([transaction], optionsDefault);

        await database.connection.saveBlock(block);

        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);

        // check foundation balance

        const foundationWallet = getFoundationWallet(walletManager);
        expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.ZERO);

        expect(Object.keys(senderWallet.getAttribute("tokens")).includes(tokenId)).toBeTrue();
        expect(await nftManager.exists(tokenId)).toBeTrue();
        expect(await nftRepository().findProperties(tokenId)).toEqual(formatProperties(properties));
    });

    it("wallet bootstrap for organization mint transaction with voucher", async () => {
        const voucherId = "6trg50ZxgEPl9Av8V67c0";
        const serviceCost = Utils.BigNumber.ZERO;
        const didType = DIDTypes.ORGANIZATION;

        const rewards: IUnsRewards = getRewardsFromDidType(didType);
        const fee = rewards.forger;

        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
            UnikVoucherId: voucherId,
            type: didType.toString(),
        };
        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            fee,
        ).createOne();

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);

        const block = delegate.forge([transaction], optionsDefault);

        await database.connection.saveBlock(block);

        await stateBuilder.run();

        // check sender balance
        expect(+senderWallet.balance).toEqual(rewards.sender);

        // check foundation balance
        const foundationWallet = getFoundationWallet(walletManager);
        expect(+foundationWallet.balance).toStrictEqual(rewards.foundation);

        expect(Object.keys(senderWallet.getAttribute("tokens")).includes(tokenId)).toBeTrue();
        expect(await nftManager.exists(tokenId)).toBeTrue();
        expect(await nftRepository().findProperties(tokenId)).toEqual(formatProperties(properties));
    });
});
