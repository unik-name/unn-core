import { Wallets } from "@arkecosystem/core-state";
import { Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import { Keys } from "@arkecosystem/crypto/src/identities";
import {
    DIDTypes,
    IDiscloseDemandCertificationPayload,
    IDiscloseDemandPayload,
    INftMintDemand,
    INftMintDemandCertificationPayload,
    INftMintDemandPayload,
    UNSCertifiedNftMintBuilder,
    UNSDiscloseExplicitBuilder,
    UnsTransactionGroup,
    UnsTransactionType,
} from "@uns/crypto";
import { ICertificationable, ICertifiedDemand } from "@uns/crypto/dist/interfaces/certification";
import { buildDiscloseDemand } from "../helpers";

export const tokenId = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
export const ownerPassphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

export const issUnikId = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
export const issPassphrase = "iss secret";
export const issKeys = Keys.fromPassphrase(issPassphrase);
export const demanderKeys = Keys.fromPassphrase(ownerPassphrase);

/**
 * Disclose data
 */
export const payloadSignature =
    "3045022100e70fd4eb3b5bd25c536198994d40d3bbd20890951e4b2b55f0c57b88726fab5902202b2bdea828872153710c2b7b3122f28ac009bf85020039d871550300a0e1bbe2";
export const certPayloadSub = "333f59d345630a57184ceb8879500335ef8eafd5505ee25d0dbd53deaa2b7fd6";

export const discloseDemandPayload: IDiscloseDemandPayload = {
    explicitValue: ["explicitValue1", "explicitValue2"],
    sub: tokenId,
    type: DIDTypes.ORGANIZATION,
    iss: tokenId,
    iat: 12345678,
};

export const certPayloadSignature =
    "3045022100a1361e93e279a74ea44a8e980360cfee4fbd0a2221d5ed38d1f75b6659f7577c02206eb8a5d6497ea55b84594daba67aa666bf992ad342bdc201ae4eb25d2f658702";
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

export * from "../../core-nft/__fixtures__";

export const dummyTransaction = ({
    type: UnsTransactionType.UnsDiscloseExplicit,
    typeGroup: UnsTransactionGroup,
    id: "fromthepast",
    asset: {
        "disclose-demand": {
            payload: {
                sub: tokenId,
                explicitValue: ["dummyExplicit"],
            },
        },
    },
} as unknown) as Interfaces.ITransactionData;

/**
 * NftMintDemandCertificationSigner data
 */

export const payloadNftMintDemandCertificationSignature =
    "3044022078a12f10b230b123748870da6a79cfa80aec4190255bad698411ba5d6b226277022053fd2b55b506d71840cf527849b577e10e91ccebbbbd9f4154521bbc540de8e9";

export const nftMintDemandCertificationPayload: INftMintDemandCertificationPayload = {
    sub: "bb32f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6a3d", // 32 bytes
    iss: tokenId,
    iat: 12345678,
};

const certification: ICertifiedDemand<ICertificationable> = {
    payload: nftMintDemandCertificationPayload,
    signature: payloadNftMintDemandCertificationSignature,
};

export const payloadNftMintDemandHashBuffer = "4176fa8a30501e7f97974d7f83492811ebb615c13ef111605a9a600bf7303e39";

export const nftMintDemandDemand: ICertifiedDemand<INftMintDemandPayload> = {
    payload: {
        iss: "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051",
        sub: "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051",
        iat: 1579165954,
        cryptoAccountAddress: "DQLiVPs2b6rHYCANjVk7vWVfQqdo5rLvDU",
    },
    signature:
        "aa45022100b35054087451d1c78c0df95c963449ad7cb9cec5d725b3b708eac06dfd93c24e022075b8d635b79feb37636e13950dc89c702640f8cef56881b49cae4417b55caa2e",
};

export const nftMintDemandHashBufferPayload: INftMintDemand = {
    nft: {
        unik: {
            tokenId,
            properties: {
                type: "1",
                anotherProperty: "12345",
            },
        },
    },
    demand: nftMintDemandDemand,
};

export const unsCertifiedNftMintTransaction = () =>
    new UNSCertifiedNftMintBuilder("unik", certification.payload.sub)
        .demand(nftMintDemandDemand)
        .certification(certification)
        .sign(ownerPassphrase);

export const wallet = () => {
    const wallet = new Wallets.Wallet(Identities.Address.fromPassphrase(ownerPassphrase));
    wallet.balance = Utils.BigNumber.make("500000000000000");
    wallet.publicKey = Identities.Keys.fromPassphrase(ownerPassphrase).publicKey;
    return wallet;
};
