import { app } from "@arkecosystem/core-container";
import { NftsBusinessRepository } from "@arkecosystem/core-database";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { DIDTypes, getRewardsFromDidType, LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades } from "@uns/crypto";
import { getFoundationWallet } from "@uns/uns-transactions/src/handlers/utils/helpers";
import { utils } from "../../../integration/core-api/utils";
import genesisBlock from "../../../utils/config/dalinet/genesisBlock.json";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

let walletManager: IWalletManager;
beforeAll(async () => {
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
    walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

    // force v2 token Eco
    Managers.configManager.getMilestone().unsTokenEcoV2 = true;
});
afterAll(async () => support.tearDown());

describe("Uns certified update", () => {
    it("mint individual unik, claim alive status then transfer unik", async () => {
        const tokenId = NftSupport.generateNftId();
        const senderPassphrase = "the passphrase " + tokenId.substr(0, 10);
        const UnikVoucherId = "my voucher" + tokenId.substr(0, 10);

        const forgeFactoryAddress = Identities.Address.fromPassphrase(UnsSupport.forgerFactoryPassphrase);
        const forgeFactoryWallet = walletManager.findByAddress(forgeFactoryAddress);
        const forgeFactoryInitialBalance = forgeFactoryWallet.balance;

        const serviceCost = Utils.BigNumber.ZERO;
        const didType = DIDTypes.INDIVIDUAL;
        const mintProperties = {
            type: didType.toString(),
            UnikVoucherId,
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
        };

        const mintTx = await UnsSupport.certifiedMintAndWait(
            tokenId,
            senderPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            mintProperties,
            serviceCost,
            0,
        );
        await expect(mintTx.id).toBeForged();

        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };

        const rewards = getRewardsFromDidType(didType);

        const updateTx = await UnsSupport.certifiedUpdateAndWait(
            tokenId,
            senderPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            properties,
            serviceCost,
            rewards.forger,
        );

        await expect(updateTx.id).toBeForged();
        const expectedProperties = { ...mintProperties, ...properties };
        await expect({ tokenId, properties: expectedProperties }).toMatchProperties();

        const senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(senderPassphrase));
        expect(+senderWallet.balance).toEqual(rewards.sender);

        const foundationWallet = getFoundationWallet(walletManager);
        expect(foundationWallet.balance).toStrictEqual(Utils.BigNumber.make(rewards.foundation).minus(serviceCost));

        expect(forgeFactoryWallet.balance).toEqual(forgeFactoryInitialBalance);

        // Check total supply
        const response = await utils.request("GET", "blockchain");
        expect(response).toBeSuccessfulResponse();
        const premine = parseInt(genesisBlock.totalAmount);
        let totalSupply = response.data.data.supply;
        const blockReward = Managers.configManager.getMilestone().reward;
        // Block 1 (genesis) has no block reward
        const totalBlockRewards = (response.data.data.block.height - 1) * blockReward;

        const activationRewards = rewards.sender + rewards.forger + rewards.foundation;
        expect(+totalSupply).toEqual(premine + totalBlockRewards + activationRewards);

        // transfer unik
        const recipientPassphrase = "the recipient passphrase";
        const recipientWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(recipientPassphrase));
        recipientWallet.publicKey = Identities.PublicKey.fromPassphrase(recipientPassphrase);
        walletManager.reindex(recipientWallet);

        const transfer = await UnsSupport.certifiedTransferAndWait(
            tokenId,
            senderPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            {},
            serviceCost,
            recipientWallet.address,
            100000000,
        );

        await expect(transfer.id).toBeForged();

        // transferred unik should keep its properties
        await expect({ tokenId, properties: expectedProperties }).toMatchProperties();

        // check total rewards & supply
        const nftsRepository = new NftsBusinessRepository(app.resolvePlugin("database-manager").connection());
        const lastHeight = app
            .resolvePlugin("state")
            .getStore()
            .getLastHeight();

        const totalrewards = await nftsRepository.getNftTotalRewards(lastHeight);
        expect(+totalrewards).toEqual(activationRewards);

        // Block 1 (genesis) has no block reward
        totalSupply = premine + (lastHeight - 1) * blockReward + activationRewards;
        expect(+walletManager.getTotalSupply()).toEqual(totalSupply);
    });

    it("mint organization unik and claim alive status", async () => {
        const tokenId = NftSupport.generateNftId();
        const senderPassphrase = "the passphrase " + tokenId.substr(0, 10);
        const UnikVoucherId = "my voucher" + tokenId.substr(0, 10);
        const forgeFactoryAddress = Identities.Address.fromPassphrase(UnsSupport.forgerFactoryPassphrase);
        const forgeFactoryWallet = walletManager.findByAddress(forgeFactoryAddress);
        const forgeFactoryInitialBalance = forgeFactoryWallet.balance;

        const foundationWallet = getFoundationWallet(walletManager);
        const foundationInitialBalance = foundationWallet.balance;

        const mintCost = Utils.BigNumber.ZERO;
        const didType = DIDTypes.ORGANIZATION;
        const mintProperties = {
            type: didType.toString(),
            UnikVoucherId,
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.MINTED.toString(),
        };
        const rewards = getRewardsFromDidType(didType);

        const mintTx = await UnsSupport.certifiedMintAndWait(
            tokenId,
            senderPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            mintProperties,
            mintCost,
            rewards.forger,
        );
        await expect(mintTx.id).toBeForged();

        const properties = {
            [LIFE_CYCLE_PROPERTY_KEY]: LifeCycleGrades.LIVE.toString(),
        };
        const serviceCost = Utils.BigNumber.make(100000000);
        const fee = 10000000;
        const updateTx = await UnsSupport.certifiedUpdateAndWait(
            tokenId,
            senderPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            properties,
            serviceCost,
            fee,
        );

        await expect(updateTx.id).toBeForged();
        await expect({ tokenId, properties: { ...mintProperties, ...properties } }).toMatchProperties();

        const senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(senderPassphrase));
        expect(senderWallet.balance).toEqual(
            Utils.BigNumber.make(rewards.sender)
                .minus(serviceCost)
                .minus(Utils.BigNumber.make(fee)),
        );

        expect(foundationWallet.balance).toStrictEqual(
            foundationInitialBalance.plus(Utils.BigNumber.make(rewards.foundation)),
        );

        expect(forgeFactoryWallet.balance).toEqual(forgeFactoryInitialBalance.plus(serviceCost));
    });
});
