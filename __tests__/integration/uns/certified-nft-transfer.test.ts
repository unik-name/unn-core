import { app } from "@arkecosystem/core-container";
import { StateBuilder } from "@arkecosystem/core-database-postgres/src";
import { Delegate } from "@arkecosystem/core-forger/src/delegate";
import { Database, State } from "@arkecosystem/core-interfaces";
import { WalletManager } from "@arkecosystem/core-state/src/wallets";
import { Identities, Networks, Utils } from "@arkecosystem/crypto";
import { DIDTypes } from "@uns/crypto";
import * as support from "../../functional/transaction-forging/__support__";
import * as NftSupport from "../../functional/transaction-forging/__support__/nft";
import { NFTTransactionFactory } from "../../helpers/nft-transaction-factory";
import * as Fixtures from "../../unit/uns-crypto/__fixtures__/index";
import genesisBlock from "../../utils/config/dalinet/genesisBlock.json";

let walletManager: WalletManager;
let database: Database.IDatabaseService;
let stateBuilder: StateBuilder;

let factoryWallet: State.IWallet;
let senderWallet: State.IWallet;
let recipientWallet: State.IWallet;
let nftRepo;

const tokenId = NftSupport.generateNftId();
const didType = DIDTypes.INDIVIDUAL;
const serviceCost = Utils.BigNumber.make("321");
const fee = Utils.BigNumber.make("1000");

beforeAll(async () => {
    await NftSupport.setUp({
        disableP2P: true,
        forgeFactoryUnikId: Fixtures.issUnikId,
        forgeFactoryPassphrase: Fixtures.issPassphrase,
    });
    walletManager = new WalletManager();
    database = app.resolvePlugin<Database.IDatabaseService>("database");
    stateBuilder = new StateBuilder(database.connection, walletManager);
    nftRepo = (database.connection as any).db.nfts;
});

afterAll(async () => support.tearDown());

describe("certifiedNftTransfer handler tests", () => {
    const optionsDefault = {
        timestamp: 12345689,
        previousBlock: {
            id: genesisBlock.id,
            height: 1,
        },
        reward: Utils.BigNumber.ZERO,
    };

    const senderPassphrase = "the sender passphrase";

    beforeEach(async () => {
        await database.reset();

        factoryWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(Fixtures.issPassphrase));
        factoryWallet.publicKey = Fixtures.issKeys.publicKey;
        walletManager.reindex(factoryWallet);

        senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(senderPassphrase));
        senderWallet.publicKey = Identities.PublicKey.fromPassphrase(senderPassphrase);
        senderWallet.setAttribute("tokens", { [tokenId]: { type: didType } });
        senderWallet.balance = serviceCost.plus(fee);
        walletManager.reindex(senderWallet);

        const recipientPassphrase = "the new owner passphrase";
        recipientWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(recipientPassphrase));
        recipientWallet.publicKey = Identities.PublicKey.fromPassphrase(recipientPassphrase);

        jest.spyOn(nftRepo, "count").mockResolvedValueOnce(1);
        // trick to mock private function
        jest.spyOn(StateBuilder.prototype as any, "verifyNftTableConsistency").mockResolvedValueOnce({} as any);
    });

    it("wallet bootstrap for nft transfer transaction", async () => {
        const updateMock = jest.spyOn(nftRepo, "updateOwnerId");
        const transaction = NFTTransactionFactory.nftCertifiedTransfer(
            tokenId,
            senderPassphrase,
            Fixtures.issUnikId,
            Fixtures.issPassphrase,
            {},
            serviceCost,
            +fee,
            recipientWallet.address,
        ).build()[0];

        const delegate = new Delegate("delegate passphrase", Networks.dalinet.network);
        const block = delegate.forge([transaction.data], optionsDefault);
        await database.connection.saveBlock(block);
        await stateBuilder.run();

        // check sender balance
        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);

        // check sender tokens
        expect(senderWallet.getAttribute("tokens")).toBeUndefined();

        // check recipient balance
        expect(recipientWallet.balance).toEqual(Utils.BigNumber.ZERO);

        // check recipient tokens
        expect(recipientWallet.getAttribute("tokens")).toEqual({ [tokenId]: { type: didType } });

        // check forgeFactory balance
        expect(factoryWallet.balance).toStrictEqual(serviceCost);
        expect(factoryWallet.balance).toStrictEqual(transaction.data.asset.certification.payload.cost);

        expect(updateMock).toHaveBeenCalledWith(tokenId, recipientWallet.address);
    });
});
