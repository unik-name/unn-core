import { DiscloseDemandPayload, unsCrypto } from "../../../packages/crypto";

export const buildDiscloseDemand = (
    discloseDemandPayload: DiscloseDemandPayload,
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
