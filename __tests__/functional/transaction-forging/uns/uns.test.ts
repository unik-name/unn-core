import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities } from "@arkecosystem/crypto";
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
        let trx = await NftSupport.mintAndWait(nftId, delegatePasshrase);
        await expect(trx.id).toBeForged();

        const discloseDemand = await UnsSupport.discloseDemand(nftId, delegatePasshrase, ["voteForMe"]);
        trx = await UnsSupport.discloseAndWait(discloseDemand, delegatePasshrase);
        await expect(trx.id).toBeForged();
        await expect({
            tokenId: nftId,
            properties: { [EXPLICIT_PROP_KEY]: "voteForMe" },
        }).toMatchProperties();

        trx = await UnsSupport.delegateRegisterAndWait(nftId, delegatePasshrase);
        await expect(trx.id).toBeForged();
        await expect({
            tokenId: nftId,
            properties: { [DELEGATE_BADGE.replace(/\//g, "%2F")]: "true" },
        }).toMatchProperties();

        const walletManager: IWalletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;

        const getVoteAmount = (pubkey: string): number => {
            const votes: string = walletManager.findByPublicKey(pubkey).getAttribute("delegate.voteBalance");
            return Number.parseInt(votes);
        };

        // Delegate votes for himself
        const initialVote = getVoteAmount(delegatePubKey);
        trx = await UnsSupport.voteAndWait(delegatePubKey, delegatePasshrase);
        await expect(trx.id).toBeForged();
        const afterVote1: number = getVoteAmount(delegatePubKey);
        expect(afterVote1).toBeGreaterThan(initialVote);
        expect(walletManager.findByPublicKey(delegatePubKey).getAttribute("vote")).toEqual(delegatePubKey);

        // Genesis votes for delegate
        // Genesis must have a unik token to vote
        trx = await NftSupport.mintAndWait(NftSupport.generateNftId());
        await expect(trx.id).toBeForged();

        const genesisPubKey: string = Identities.PublicKey.fromPassphrase(NftSupport.defaultPassphrase);
        trx = await UnsSupport.voteAndWait(delegatePubKey);
        await expect(trx.id).toBeForged();
        const afterVote2: number = getVoteAmount(delegatePubKey);
        expect(afterVote2).toBeGreaterThan(afterVote1);

        expect(walletManager.findByPublicKey(genesisPubKey).getAttribute("vote")).toEqual(delegatePubKey);
        expect(delegateWallet.getAttribute("delegate.voteBalance")).toEqual(
            delegateWallet.balance.plus(genesisWallet.balance),
        );

        trx = await UnsSupport.unvoteAndWait(delegatePubKey, delegatePasshrase);
        await expect(trx.id).toBeForged();
        const afterUnvote1: number = getVoteAmount(delegatePubKey);
        expect(afterUnvote1).toBeLessThan(afterVote2);
        expect(afterUnvote1).toBeGreaterThan(afterVote1);
        expect(walletManager.findByPublicKey(delegatePubKey).getAttribute("vote")).toBeUndefined();

        trx = await UnsSupport.unvoteAndWait(delegatePubKey);
        await expect(trx.id).toBeForged();
        const afterUnvote2: number = getVoteAmount(delegatePubKey);
        expect(afterUnvote2).toEqual(0);
        expect(walletManager.findByPublicKey(genesisPubKey).getAttribute("vote")).toBeUndefined();

        trx = await UnsSupport.delegateResignAndWait(delegatePasshrase);
        await expect(trx.id).toBeForged();
        await expect({
            tokenId: nftId,
            properties: { [DELEGATE_BADGE.replace(/\//g, "%2F")]: "false" },
        }).toMatchProperties();
    });
});
