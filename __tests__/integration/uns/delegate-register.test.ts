import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Container, Database } from "@arkecosystem/core-interfaces";
import { Wallets } from "@arkecosystem/core-state";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Constants, Identities, Managers, Networks, Utils } from "@arkecosystem/crypto";
import { nftRepository } from "@uns/core-nft";
import { UNSDelegateRegisterBuilder } from "@uns/crypto";
import * as NftSupport from "../../functional/transaction-forging/__support__/nft";
import { TransactionFactory } from "../../helpers";
import genesisBlock from "../../utils/config/dalinet/genesisBlock.json";
import { tearDown } from "../core-transactions/__support__/setup";

let container: Container.IContainer;
let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;
const tokenId = "a99ee098dd4fd00ba513e1ca09abb8522a8ba94fa2a7a81dd674eac27ce66b94";
const { SATOSHI } = Constants;

beforeAll(async () => {
    container = await NftSupport.setUp();
    walletManager = new WalletManager();
    database = container.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
});

afterAll(async () => {
    await database.reset();
    await tearDown();
});

describe("unsDelegateRegister handler tests", () => {
    const optionsDefault = {
        timestamp: 12345689,
        previousBlock: {
            id: genesisBlock.id,
            height: 1,
        },
        reward: Utils.BigNumber.ZERO,
    };
    const delegateType = "2";

    it("wallet bootstrap for unsDelegateRegister", async () => {
        await database.reset();
        jest.spyOn(nftRepository(), "findPropertyBatch").mockResolvedValueOnce([
            {
                nftId: tokenId,
                value: delegateType,
            },
        ]);

        // Generate delegate wallet
        const delegatePassphrase = `delegate secret`;
        const delegateKey = Identities.PublicKey.fromPassphrase(delegatePassphrase);
        const delegateWallet = new Wallets.Wallet(Identities.Address.fromPassphrase(delegatePassphrase));
        delegateWallet.balance = Utils.BigNumber.make(1000 * SATOSHI);
        delegateWallet.publicKey = delegateKey;
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
        expect(delegateAttributes.delegate.type).toEqual(parseInt(delegateType));
        const nbIndividuals = Managers.configManager.getMilestone().nbDelegatesByType.individual;
        expect(delegateAttributes.delegate.rank).toEqual(nbIndividuals + 1);
    });
});
