import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Database } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Constants, Identities, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { UNSDelegateRegisterBuilder } from "@uns/crypto";
import * as support from "../../functional/transaction-forging/__support__";
import * as NftSupport from "../../functional/transaction-forging/__support__/nft";
import { TransactionFactory } from "../../helpers";
import genesisBlock from "../../utils/config/dalinet/genesisBlock.json";

let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;
let nftRepo;

const tokenId = NftSupport.generateNftId();
const { SATOSHI } = Constants;

beforeAll(async () => {
    await NftSupport.setUp({ disableP2P: true });
    walletManager = new WalletManager();
    database = app.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
    const height = Managers.configManager.getMilestones().find(milestone => !!milestone.nbDelegatesByType).height;
    Managers.configManager.setHeight(height);
    nftRepo = (database.connection as any).db.nfts;
});

afterAll(async () => support.tearDown());

describe("unsDelegateRegister handler tests", () => {
    const optionsDefault = {
        timestamp: 12345689,
        previousBlock: {
            id: genesisBlock.id,
            height: 1,
        },
        reward: Utils.BigNumber.ZERO,
    };
    const delegateType = 2;

    it("wallet bootstrap for unsDelegateRegister", async () => {
        jest.spyOn(nftRepo, "count").mockResolvedValueOnce(1);
        // trick to mock private function
        jest.spyOn(StateBuilder.prototype as any, "verifyNftTableConsistency").mockResolvedValueOnce({} as any);

        await database.reset();

        // Generate delegate wallet
        const delegatePassphrase = `delegate secret`;
        const delegateKey = Identities.PublicKey.fromPassphrase(delegatePassphrase);
        const delegateWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(delegatePassphrase));
        delegateWallet.balance = Utils.BigNumber.make(1000 * SATOSHI);
        delegateWallet.publicKey = delegateKey;
        delegateWallet.setAttribute("tokens", { [tokenId]: { type: delegateType } });
        walletManager.reindex(delegateWallet);

        const transaction = new TransactionFactory(new UNSDelegateRegisterBuilder().usernameAsset(tokenId))
            .withNetwork(NftSupport.network)
            .withPassphrase(delegatePassphrase)
            .createOne();

        const delegate = new Delegate("cool delegate passphrase", Networks.dalinet.network);

        const block = delegate.forge([transaction], optionsDefault);

        await database.connection.saveBlock(block);

        await stateBuilder.run();

        // check delegate attributes
        const delegateAttributes = delegateWallet.getAttributes();
        expect(delegateAttributes.delegate.type).toEqual(delegateType);
        const nbIndividuals = Managers.configManager.getMilestone().nbDelegatesByType.individual;
        expect(delegateAttributes.delegate.rank).toEqual(nbIndividuals + 1);
    });
});
