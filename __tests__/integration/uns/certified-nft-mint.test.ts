import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Database, State } from "@arkecosystem/core-interfaces";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Identities, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { nftRepository, NftsManager } from "@uns/core-nft";
import { DIDTypes, getRewardsFromDidType } from "@uns/crypto";
import * as support from "../../functional/transaction-forging/__support__";
import * as NftSupport from "../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../helpers/nft-transaction-factory";
import * as Fixtures from "../../unit/uns-crypto/__fixtures__/index";
import genesisBlock from "../../utils/config/dalinet/genesisBlock.json";

let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;
const tokenId = NftSupport.generateNftId();
let nftManager: NftsManager;

beforeAll(async () => {
    await NftSupport.setUp({ disableP2P: true });
    Managers.configManager.setFromPreset(Fixtures.network);

    walletManager = new WalletManager();
    database = app.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
    nftManager = app.resolvePlugin<NftsManager>("core-nft");
});

afterAll(async () => support.tearDown());

describe("certifiedNftMint handler tests", () => {
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
        jest.spyOn(nftRepository(), "findById").mockResolvedValue({
            tokenId: Fixtures.issUnikId,
            ownerId: Fixtures.issuerAddress,
        });

        forgeFactoryWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(Fixtures.issPassphrase));
        forgeFactoryWallet.publicKey = Fixtures.issKeys.publicKey;
        walletManager.reindex(forgeFactoryWallet);

        senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(passphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(passphrase);
        walletManager.reindex(senderWallet);
    });

    it("wallet bootstrap for mint transaction", async () => {
        const senderInitialBalance = Utils.BigNumber.make("200000000");
        senderWallet.balance = senderInitialBalance;
        walletManager.reindex(senderWallet);
        const serviceCost = Utils.BigNumber.make("100000000");
        const properties = {
            type: "1",
        };

        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
        ).createOne();

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);

        const block = delegate.forge([transaction], optionsDefault);

        await database.connection.saveBlock(block);

        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(senderInitialBalance.minus(serviceCost).minus(transaction.fee));

        // check forgeFactory balance
        expect(forgeFactoryWallet.balance).toEqual(serviceCost);
        expect(forgeFactoryWallet.balance).toStrictEqual(transaction.asset.certification.payload.cost);

        expect(Object.keys(senderWallet.getAttribute("tokens")).includes(tokenId)).toBeTrue();
        expect(await nftManager.exists(tokenId)).toBeTrue();
    });

    it("wallet bootstrap for mint transaction with voucher", async () => {
        const voucherId = "6trg50ZxgEPl9Av8V67c0";
        const serviceCost = Utils.BigNumber.ZERO;
        const didType = DIDTypes.INDIVIDUAL;
        const rewards = getRewardsFromDidType(didType);

        const properties = {
            type: didType.toString(),
            UnikVoucherId: voucherId,
        };

        const transaction = NFTTransactionFactory.nftCertifiedMint(
            tokenId,
            passphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            properties,
            serviceCost,
            rewards.forger,
        ).createOne();

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);

        const block = delegate.forge([transaction], optionsDefault);

        await database.connection.saveBlock(block);

        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(Utils.BigNumber.make(rewards.sender));

        // check foundation balance
        const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
        const foundationWallet = walletManager.findByAddress(Identities.Address.fromPublicKey(foundationPublicKey));
        expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.make(rewards.foundation));

        expect(Object.keys(senderWallet.getAttribute("tokens")).includes(tokenId)).toBeTrue();
        expect(await nftManager.exists(tokenId)).toBeTrue();
    });
});
