import { State } from "@arkecosystem/core-interfaces";
import { Wallet } from "@arkecosystem/core-state/dist/wallets";
import { Constants, Identities, Utils } from "@arkecosystem/crypto";
import {
    IDiscloseDemandPayload,
    INftDemand,
    INftDemandCertificationPayload,
    INftDemandPayload,
    NftCertificationSigner,
    NftDemandHashBuffer,
    NftDemandSigner,
    unsCrypto,
    UNSDiscloseExplicitBuilder,
} from "@uns/crypto";
import * as Fixtures from "./__fixtures__";
const { SATOSHI } = Constants;

export const buildDiscloseDemand = (
    discloseDemandPayload: IDiscloseDemandPayload,
    demandIssuerPassphrase,
    certifIssuerUnikId,
    certificationIssuerPassphrase,
) => {
    const discloseDemandCertificationPayload = {
        sub: unsCrypto.getPayloadHashBuffer(discloseDemandPayload).toString("hex"),
        iss: certifIssuerUnikId,
        iat: discloseDemandPayload.iat,
    };

    return {
        "disclose-demand": {
            payload: discloseDemandPayload,
            signature: unsCrypto.signPayload(discloseDemandPayload, demandIssuerPassphrase),
        },
        "disclose-demand-certification": {
            payload: discloseDemandCertificationPayload,
            signature: unsCrypto.signPayload(discloseDemandCertificationPayload, certificationIssuerPassphrase),
        },
    };
};

export const discloseDemand = buildDiscloseDemand(
    Fixtures.discloseDemandPayload,
    Fixtures.ownerPassphrase,
    Fixtures.issUnikId,
    Fixtures.issPassphrase,
);

export const discloseExplicitTransaction = () =>
    new UNSDiscloseExplicitBuilder()
        .discloseDemand(discloseDemand["disclose-demand"], discloseDemand["disclose-demand-certification"])
        .sign(Fixtures.ownerPassphrase);

export const buildCertifiedDemand = (
    tokenId: string,
    properties,
    demanderPassphrase: string,
    cost: Utils.BigNumber = Utils.BigNumber.ZERO,
    issUnikId: string = Fixtures.issUnikId,
    issPassphrase: string = Fixtures.issPassphrase,
) => {
    const demandPayload: INftDemandPayload = {
        iss: tokenId,
        sub: tokenId,
        iat: 1579165954,
        cryptoAccountAddress: Identities.Address.fromPassphrase(demanderPassphrase),
    };
    const demandAsset: INftDemand = {
        nft: { unik: { tokenId, properties } },
        demand: { payload: demandPayload, signature: "" },
    };
    demandAsset.demand.signature = new NftDemandSigner(demandAsset).sign(demanderPassphrase);

    const certificationPayload: INftDemandCertificationPayload = {
        iss: issUnikId,
        sub: new NftDemandHashBuffer(demandAsset).getPayloadHashBuffer(),
        iat: 12345678,
        cost,
    };
    const certification = {
        payload: certificationPayload,
        signature: new NftCertificationSigner(certificationPayload).sign(issPassphrase),
    };
    return {
        demand: demandAsset.demand,
        certification,
    };
};

export const buildDelegatePool = (walletManager, nbDelegates): State.IWallet[] => {
    for (let i = 0; i < nbDelegates; i++) {
        // Generate nbDelegates wallet of each types
        const delegatePassphrase = `delegate secret ${i}`;
        const delegateKey = Identities.PublicKey.fromPassphrase(delegatePassphrase);
        const delegate = new Wallet(Identities.Address.fromPassphrase(delegatePassphrase));
        delegate.publicKey = delegateKey;
        delegate.setAttribute("delegate", {
            username: `delegate${i}`,
            voteBalance: Utils.BigNumber.ZERO,
            type: (i % 3) + 1,
            forgedFees: Utils.BigNumber.make(123),
            forgedRewards: Utils.BigNumber.make(456),
            producedBlocks: 75,
        });

        // Generate nbDelegates voters wallet.
        const voterPassphrase = `voter secret ${i}`;
        const voterKey = Identities.PublicKey.fromPassphrase(voterPassphrase);
        const voter = new Wallet(Identities.Address.fromPassphrase(voterPassphrase));
        voter.balance = Utils.BigNumber.make((nbDelegates - i) * 100 * SATOSHI);
        voter.publicKey = voterKey;
        voter.setAttribute("vote", delegateKey);

        walletManager.index([delegate, voter]);
    }

    walletManager.buildVoteBalances();
    return walletManager.buildDelegateRanking();
};
