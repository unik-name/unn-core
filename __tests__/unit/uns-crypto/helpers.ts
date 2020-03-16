import { Identities, Utils } from "@arkecosystem/crypto";
import {
    IDiscloseDemandPayload,
    INftDemand,
    INftDemandCertificationPayload,
    INftMintDemandPayload,
    NftMintDemandCertificationSigner,
    NftMintDemandHashBuffer,
    NftMintDemandSigner,
    unsCrypto,
    UNSDiscloseExplicitBuilder,
} from "@uns/crypto";
import * as Fixtures from "./__fixtures__";

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
    const demandPayload: INftMintDemandPayload = {
        iss: tokenId,
        sub: tokenId,
        iat: 1579165954,
        cryptoAccountAddress: Identities.Address.fromPassphrase(demanderPassphrase),
    };
    const demandAsset: INftDemand = {
        nft: { unik: { tokenId, properties } },
        demand: { payload: demandPayload, signature: "" },
    };
    demandAsset.demand.signature = new NftMintDemandSigner(demandAsset).sign(demanderPassphrase);

    const certificationPayload: INftDemandCertificationPayload = {
        iss: issUnikId,
        sub: new NftMintDemandHashBuffer(demandAsset).getPayloadHashBuffer(),
        iat: 12345678,
        cost,
    };
    const certification = {
        payload: certificationPayload,
        signature: new NftMintDemandCertificationSigner(certificationPayload).sign(issPassphrase),
    };
    return {
        demand: demandAsset.demand,
        certification,
    };
};
