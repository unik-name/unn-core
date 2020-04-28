import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWallet, IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Managers } from "@arkecosystem/crypto";
import { DELEGATE_BADGE } from "@uns/uns-transactions";
import { EXPLICIT_PROP_KEY } from "@uns/uns-transactions/src/handlers/utils/helpers";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

beforeAll(NftSupport.setUp);
afterAll(support.tearDown);

describe("Uns delegate scenario", () => {
    const delegatePasshrase = "delegate passphrase";
    const delegatePubKey: string = Identities.PublicKey.fromPassphrase(delegatePasshrase);

    beforeAll(async () => {
        await UnsSupport.setupForgeFactory();
    });

    it("create new wallet => send uns => mint nft => disclose unikname => register => vote for itself + vote from genesis => unvotes => resign", async () => {
        await NftSupport.transferAndWait(Identities.Address.fromPassphrase(delegatePasshrase), 10);

        const nftId = NftSupport.generateNftId();
        const nftType = "2"; // Organization
        let trx = await NftSupport.mintAndWait(nftId, { type: nftType }, delegatePasshrase);
        await expect(trx.id).toBeForged();

        const discloseDemand = await UnsSupport.discloseDemand(nftId, delegatePasshrase, ["voteForMe"]);
        trx = await UnsSupport.discloseAndWait(discloseDemand, delegatePasshrase);
        await expect(trx.id).toBeForged();
        await expect({
            tokenId: nftId,
            properties: { type: nftType, [EXPLICIT_PROP_KEY]: "voteForMe" },
        }).toMatchProperties();

        trx = await UnsSupport.delegateRegisterAndWait(nftId, delegatePasshrase);
        await expect(trx.id).toBeForged();
        await expect({
            tokenId: nftId,
            properties: { type: nftType, [DELEGATE_BADGE.replace(/\//g, "%2F")]: "true" },
        }).toMatchProperties();

        const walletManager: IWalletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;
        const delegateWallet = walletManager.findByPublicKey(delegatePubKey);

        const getVoteAmount = (wallet: IWallet): number => {
            const votes: string = wallet.getAttribute("delegate.voteBalance");
            return Number.parseInt(votes);
        };

        // Delegate votes for himself
        const initialVote = getVoteAmount(delegateWallet);
        trx = await UnsSupport.voteAndWait(delegatePubKey, delegatePasshrase);
        await expect(trx.id).toBeForged();
        const afterVote1: number = getVoteAmount(delegateWallet);
        expect(afterVote1).toBeGreaterThan(initialVote);
        expect(delegateWallet.getAttribute("vote")).toEqual(delegatePubKey);

        // Genesis votes for delegate
        // Genesis must have a unik token to vote
        trx = await NftSupport.mintAndWait(NftSupport.generateNftId(), { type: nftType });
        await expect(trx.id).toBeForged();

        const genesisPubKey: string = Identities.PublicKey.fromPassphrase(NftSupport.defaultPassphrase);
        const genesisWallet: IWallet = walletManager.findByPublicKey(genesisPubKey);

        trx = await UnsSupport.voteAndWait(delegatePubKey);
        await expect(trx.id).toBeForged();
        const afterVote2: number = getVoteAmount(delegateWallet);
        expect(afterVote2).toBeGreaterThan(afterVote1);
        expect(genesisWallet.getAttribute("vote")).toEqual(delegatePubKey);

        // Check delegate attributes
        expect(delegateWallet.getAttribute("delegate.type")).toEqual(parseInt(nftType));
        const nbIndividuals = Managers.configManager.getMilestone().nbDelegatesByType.individual;
        expect(delegateWallet.getAttribute("delegate.rank")).toEqual(nbIndividuals + 1);
        expect(delegateWallet.getAttribute("delegate.voteBalance")).toEqual(
            delegateWallet.balance.plus(genesisWallet.balance),
        );
        expect(delegateWallet.getAttribute("delegate.weightedVoteBalance")).toEqual(
            delegateWallet.getAttribute("delegate.voteBalance"),
        );

        trx = await UnsSupport.unvoteAndWait(delegatePubKey, delegatePasshrase);
        await expect(trx.id).toBeForged();
        const afterUnvote1: number = getVoteAmount(delegateWallet);
        expect(afterUnvote1).toBeLessThan(afterVote2);
        expect(afterUnvote1).toBeGreaterThan(afterVote1);
        expect(delegateWallet.getAttribute("vote")).toBeUndefined();

        trx = await UnsSupport.unvoteAndWait(delegatePubKey);
        await expect(trx.id).toBeForged();
        const afterUnvote2: number = getVoteAmount(delegateWallet);
        expect(afterUnvote2).toEqual(0);
        expect(genesisWallet.getAttribute("vote")).toBeUndefined();

        trx = await UnsSupport.delegateResignAndWait(delegatePasshrase);
        await expect(trx.id).toBeForged();
        await expect({
            tokenId: nftId,
            properties: { [DELEGATE_BADGE.replace(/\//g, "%2F")]: "false" },
        }).toMatchProperties();
    });
});
