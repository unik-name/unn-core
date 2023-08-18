import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import {
    CertifiedNftMintTransaction,
    CertifiedNftUpdateTransaction,
    DIDTypes,
    UNSDelegateRegisterBuilder,
    UNSDelegateResignBuilder,
    UNSDiscloseExplicitBuilder,
    UNSVoteBuilder,
} from "@uns/crypto";
import * as txHelpers from "@uns/uns-transactions/dist/handlers/utils/helpers";
import { snoozeForBlock } from ".";
import { TransactionFactory } from "../../../helpers";
import { NFTTransactionFactory } from "../../../helpers/nft-transaction-factory";
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
    Managers.configManager.set("network.forgeFactory.unikidWhiteList", [forgerFactoryTokenId]);
    await NftSupport.transferAndWait(Identities.Address.fromPassphrase(forgerFactoryPassphrase), 1000);
    await NftSupport.mintAndWait(forgerFactoryTokenId, { type: "1" }, forgerFactoryPassphrase);
    jest.spyOn(txHelpers, "getForgeFactoryAddress").mockResolvedValue(
        Identities.Address.fromPassphrase(forgerFactoryPassphrase),
    );
    return forgerFactoryTokenId;
};

export const certifiedMintAndWait = async (
    tokenId: string,
    senderPassphrase: string,
    issUnikId: string,
    issPassphrase: string,
    properties,
    serviceCost: Utils.BigNumber,
    fee: number = +CertifiedNftMintTransaction.staticFee(),
) => {
    const t = NFTTransactionFactory.nftCertifiedMint(
        tokenId,
        senderPassphrase,
        issUnikId,
        issPassphrase,
        properties,
        serviceCost,
        fee,
    ).createOne();
    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const certifiedUpdateAndWait = async (
    tokenId: string,
    senderPassphrase: string,
    issUnikId: string,
    issPassphrase: string,
    properties,
    serviceCost: Utils.BigNumber,
    fee: number = +CertifiedNftUpdateTransaction.staticFee(),
) => {
    const t = NFTTransactionFactory.nftCertifiedUpdate(
        tokenId,
        senderPassphrase,
        issUnikId,
        issPassphrase,
        properties,
        serviceCost,
        fee,
    ).createOne();
    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};

export const certifiedTransferAndWait = async (
    tokenId: string,
    senderPassphrase: string,
    issUnikId: string,
    issPassphrase: string,
    properties,
    serviceCost: Utils.BigNumber,
    recipient: string,
    fee: number = +CertifiedNftUpdateTransaction.staticFee(),
) => {
    const t = NFTTransactionFactory.nftCertifiedTransfer(
        tokenId,
        senderPassphrase,
        issUnikId,
        issPassphrase,
        properties,
        serviceCost,
        fee,
        recipient,
    ).createOne();
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
