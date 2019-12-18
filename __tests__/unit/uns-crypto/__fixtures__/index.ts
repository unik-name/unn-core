import { Interfaces } from "@arkecosystem/crypto";
import { Keys } from "@arkecosystem/crypto/src/identities";
import {
    DIDTypes,
    IDiscloseDemandCertificationPayload,
    IDiscloseDemandPayload,
    UNSDiscloseExplicitBuilder,
    UnsTransactionGroup,
    UnsTransactionType,
} from "@uns/crypto";
import { buildDiscloseDemand } from "../helpers";

export const tokenId = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
export const ownerPassphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
export const payloadSignature =
    "3045022100e70fd4eb3b5bd25c536198994d40d3bbd20890951e4b2b55f0c57b88726fab5902202b2bdea828872153710c2b7b3122f28ac009bf85020039d871550300a0e1bbe2";
export const issUnikId = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
export const issPassphrase = "iss secret";
export const certPayloadSignature =
    "3045022100a1361e93e279a74ea44a8e980360cfee4fbd0a2221d5ed38d1f75b6659f7577c02206eb8a5d6497ea55b84594daba67aa666bf992ad342bdc201ae4eb25d2f658702";
export const certPayloadSub = "333f59d345630a57184ceb8879500335ef8eafd5505ee25d0dbd53deaa2b7fd6";

export const discloseDemandPayload: IDiscloseDemandPayload = {
    explicitValue: ["explicitValue1", "explicitValue2"],
    sub: tokenId,
    type: DIDTypes.ORGANIZATION,
    iss: tokenId,
    iat: 12345678,
};
export const certificationPayload: IDiscloseDemandCertificationPayload = {
    iss: issUnikId,
    sub: certPayloadSub,
    iat: 12345678,
};

export const discloseDemand = buildDiscloseDemand(discloseDemandPayload, ownerPassphrase, issUnikId, issPassphrase);

export const discloseExplicitTransaction = () =>
    new UNSDiscloseExplicitBuilder()
        .discloseDemand(discloseDemand["disclose-demand"], discloseDemand["disclose-demand-certification"])
        .sign(ownerPassphrase);

export const issKeys = Keys.fromPassphrase(issPassphrase);
export const demanderKeys = Keys.fromPassphrase(ownerPassphrase);
export * from "../../core-nft/__fixtures__";

export const dummyTransaction = ({
    type: UnsTransactionType.UnsDiscloseExplicit,
    typeGroup: UnsTransactionGroup,
    id: "dummy",
    asset: {
        "disclose-demand": {
            payload: {
                sub: tokenId,
                explicitValue: ["IamDisclosed"],
            },
        },
    },
} as unknown) as Interfaces.ITransactionData;
