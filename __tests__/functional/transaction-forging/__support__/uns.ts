import { Identities } from "@arkecosystem/crypto";
import {
    DIDTypes,
    UNSDelegateRegisterBuilder,
    UNSDelegateResignBuilder,
    UNSDiscloseExplicitBuilder,
} from "@uns/crypto";
import { snoozeForBlock } from ".";
import { TransactionFactory } from "../../../helpers";
import { buildDiscloseDemand } from "../../../unit/uns-crypto/helpers";
import * as NftSupport from "./nft";
import "./nft-jest-matchers";

const forgerFactoryPassphrase = "cactus cute please spirit reveal raw goose emotion latin subject forum panic";
const forgerFactoryTokenId = "5f96dd359ab300e2c702a54760f4d74a11db076aa17575179d36e06d75c96511";

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
    await NftSupport.transferAndWait(Identities.Address.fromPassphrase(forgerFactoryPassphrase), 1);
    await NftSupport.mintAndWait(forgerFactoryTokenId, forgerFactoryPassphrase);
    return forgerFactoryTokenId;
};
