import { Wallets } from "@arkecosystem/core-state";
import { Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import {
    DIDTypes,
    ICertifiedDemand,
    IDiscloseDemandCertificationPayload,
    IDiscloseDemandPayload,
    INftMintDemand,
    INftMintDemandCertification,
    INftMintDemandCertificationPayload,
    INftMintDemandPayload,
    INftUpdateDemand,
    INftUpdateDemandCertification,
    NftUpdateDemandCertificationSigner,
    NftUpdateDemandHashBuffer,
    NftUpdateDemandSigner,
    UNSCertifiedNftMintBuilder,
    UNSCertifiedNftUpdateBuilder,
    UnsTransactionGroup,
    UnsTransactionType,
} from "@uns/crypto";

export const tokenId = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
export const ownerPassphrase = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";

export const issUnikId = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
export const issPassphrase = "iss secret";
export const issKeys = Identities.Keys.fromPassphrase(issPassphrase);
export const issuerAddress = Identities.Address.fromPassphrase(issPassphrase);

export const demanderKeys = Identities.Keys.fromPassphrase(ownerPassphrase);

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
    "304502210095126b529b51634f9d0126b788d83b7d5af529995b271bb02d8a8b64e6a6fd1b022008a776a6da2c3886c651b4cba4ab9c648225971210cfdd533190a2cfb06c2759";

export const cost = new Utils.BigNumber(1234);
export const certifIat = 12345678;
export const nftMintDemandCertificationPayload: INftMintDemandCertificationPayload = {
    sub: "78df95c0eb364043499c83ee6045e3395f21dbfb5f8bfe58590f59cb639ab8e1", // 32 bytes
    iss: issUnikId,
    iat: certifIat,
    cost,
};

const certification: INftMintDemandCertification = {
    payload: nftMintDemandCertificationPayload,
    signature: payloadNftMintDemandCertificationSignature,
};

export const payloadNftMintDemandHashBuffer = "78df95c0eb364043499c83ee6045e3395f21dbfb5f8bfe58590f59cb639ab8e1";
export const cryptoAccountAddress = "DQLiVPs2b6rHYCANjVk7vWVfQqdo5rLvDU";

export const nftMintDemand: ICertifiedDemand<INftMintDemandPayload> = {
    payload: {
        iss: tokenId,
        sub: tokenId,
        iat: 1579165954,
        cryptoAccountAddress,
    },
    signature:
        "3045022100ab032a9b879dabcf0fc8792126d9db1501ad4ee8007f84bc299ef113ec036b5102200aa1678357d0885da7346d21aa27b3b18f37f49033de73e1ce6bb1263b2c231a",
};
const mintProperties = {
    type: "1",
    anotherProperty: "12345",
};
export const nftMintRequest: INftMintDemand = {
    nft: {
        unik: {
            tokenId,
            properties: mintProperties,
        },
    },
    demand: nftMintDemand,
};

export const unsCertifiedNftMintTransaction = (cert: INftMintDemandCertification = certification) => {
    return new UNSCertifiedNftMintBuilder("unik", tokenId)
        .properties(mintProperties)
        .demand(nftMintDemand)
        .certification(cert, issuerAddress)
        .nonce("1")
        .sign(ownerPassphrase);
};

export const unsCertifiedNftUpdateTransaction = (
    cert: INftUpdateDemandCertification = certification,
    demand: INftUpdateDemand = nftMintRequest,
    issuer: string = issuerAddress,
) => {
    return new UNSCertifiedNftUpdateBuilder("unik", demand.nft.unik.tokenId)
        .properties(demand.nft.unik.properties)
        .demand(demand.demand)
        .certification(cert, issuer)
        .nonce("1")
        .sign(ownerPassphrase);
};

export const walletBalance = Utils.BigNumber.make("500000000000000");
export const wallet = () => {
    const wallet = new Wallets.Wallet(Identities.Address.fromPassphrase(ownerPassphrase));
    wallet.balance = walletBalance;
    wallet.publicKey = Identities.Keys.fromPassphrase(ownerPassphrase).publicKey;
    return wallet;
};

export const buildUrlCheckerTransaction = (issuer, sender) => {
    const properties = {
        "Verified/URL/MyUrl": "https://www.toto.lol",
        "Verified/URL/MyUrl/proof":
            '{"iat":1598434813,"exp":1598694013,"jti":"SyjfEteA8tSAPRjV4b_lw","sig":"jwtSignature"}',
    };
    const updateDemand: INftUpdateDemand = {
        nft: {
            unik: {
                tokenId: sender.tokenId,
                properties,
            },
        },
        demand: {
            payload: {
                iss: sender.tokenId,
                sub: sender.tokenId,
                iat: 1579165954,
                cryptoAccountAddress: sender.address,
            },
            signature: "",
        },
    };

    updateDemand.demand.signature = new NftUpdateDemandSigner(updateDemand).sign(sender.passphrase);

    const hash = new NftUpdateDemandHashBuffer(updateDemand).getPayloadHashBuffer();

    const urlCheckDemandCertificationPayload = {
        sub: hash,
        iss: issuer.tokenId,
        iat: 12345678,
        cost: Utils.BigNumber.make(100000000),
    };

    const certification = {
        payload: urlCheckDemandCertificationPayload,
        signature: new NftUpdateDemandCertificationSigner(urlCheckDemandCertificationPayload).sign(issuer.passphrase),
    };

    return unsCertifiedNftUpdateTransaction(certification, updateDemand, issuer.address);
};

export * from "../../core-nft/__fixtures__";
