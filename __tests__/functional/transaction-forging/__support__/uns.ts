import { Identities } from "@arkecosystem/crypto";
import {
    DIDTypes,
    UNSCertifiedNftMintBuilder,
    UNSDelegateRegisterBuilder,
    UNSDelegateResignBuilder,
    UNSDiscloseExplicitBuilder,
    UNSVoteBuilder,
} from "@uns/crypto";
import { snoozeForBlock } from ".";
import { TransactionFactory } from "../../../helpers";
import { buildDiscloseDemand } from "../../../unit/uns-crypto/helpers";
import * as NftSupport from "./nft";
import "./nft-jest-matchers";

export const forgerFactoryPassphrase = "The forge factory passphrase";
export const forgerFactoryTokenId = "5f96dd359ab300e2c702a54760f4d74a11db076aa17575179d36e06d75c96511";

export const discloseExplicitTransaction = discloseDemand => {
    const discloseBuilder = new UNSDiscloseExplicitBuilder().discloseDemand(
        discloseDemand["disclose-demand"],
        discloseDemand["disclose-demand-certification"],
    );
    return new TransactionFactory(discloseBuilder);
};

export const discloseAndWait = async (discloseDemand, passphrase = NftSupport.defaultPassphrase) => {
    const t = discloseExplicitTransaction(discloseDemand)
        .withNetwork(NftSupport.network)
        .withPassphrase(passphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const delegateRegisterAndWait = async (tokenId, passphrase = NftSupport.defaultPassphrase) => {
    const t = new TransactionFactory(new UNSDelegateRegisterBuilder().usernameAsset(tokenId))
        .withNetwork(NftSupport.network)
        .withPassphrase(passphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const delegateResignAndWait = async (passphrase = NftSupport.defaultPassphrase) => {
    const t = new TransactionFactory(new UNSDelegateResignBuilder())
        .withNetwork(NftSupport.network)
        .withPassphrase(passphrase)
        .createOne();
    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const discloseDemand = async (tokenId, demanderPassphrase, explicitValues: string[]) => {
    /* Build Disclose demand */
    const discloseDemandPayload = {
        explicitValue: explicitValues,
        sub: tokenId,
        type: DIDTypes.INDIVIDUAL,
        iss: tokenId,
        iat: Date.now(),
    };
    const discloseDemand = buildDiscloseDemand(
        discloseDemandPayload,
        demanderPassphrase,
        forgerFactoryTokenId,
        forgerFactoryPassphrase,
    );

    return discloseDemand;
};

export const setupForgeFactory = async () => {
    await NftSupport.transferAndWait(Identities.Address.fromPassphrase(forgerFactoryPassphrase), 1000);
    await NftSupport.mintAndWait(forgerFactoryTokenId, { type: "1" }, forgerFactoryPassphrase);
    return forgerFactoryTokenId;
};

export const certifiedMintAndWait = async (
    nftId,
    properties,
    demand,
    passphrase = NftSupport.defaultPassphrase,
    fee: number = 0,
) => {
    const t = new TransactionFactory(
        new UNSCertifiedNftMintBuilder("unik", nftId)
            .properties(properties)
            .demand(demand.demand)
            .certification(demand.certification, Identities.Address.fromPassphrase(forgerFactoryPassphrase)),
    )
        .withFee(fee)
        .withNetwork(NftSupport.network)
        .withPassphrase(passphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const certifiedUpdateAndWait = async (builder, passphrase = NftSupport.defaultPassphrase) => {
    const t = new TransactionFactory(builder)
        .withNetwork(NftSupport.network)
        .withPassphrase(passphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const voteAndWait = async (delegatePubKey, passphrase = NftSupport.defaultPassphrase) => {
    const t = new TransactionFactory(new UNSVoteBuilder().votesAsset([`+${delegatePubKey}`]))
        .withNetwork(NftSupport.network)
        .withPassphrase(passphrase)
        .createOne();
    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const unvoteAndWait = async (delegatePubKey, passphrase = NftSupport.defaultPassphrase) => {
    const t = new TransactionFactory(new UNSVoteBuilder().votesAsset([`-${delegatePubKey}`]))
        .withNetwork(NftSupport.network)
        .withPassphrase(passphrase)
        .createOne();
    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};
