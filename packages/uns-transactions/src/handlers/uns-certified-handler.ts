import { State } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import { nftRepository } from "@uns/core-nft";
import {
    ICertificationable,
    INftDemand,
    INftMintDemand,
    IPayloadHashBuffer,
    IPayloadSigner,
    unsCrypto,
} from "@uns/crypto";
import {
    CertifiedDemandIssuerNotFound,
    CertifiedDemandNotAllowedIssuerError,
    NftCertificationBadPayloadSubjectError,
    NftCertificationBadSignatureError,
} from "../errors";
import { checkAndfindPublicKeyIssuer } from "./utils/helpers";

export abstract class CertifiedTransactionHandler {
    protected abstract getPayloadSigner(payload: ICertificationable): IPayloadSigner;
    protected abstract getPayloadHashBuffer(demand: INftDemand): IPayloadHashBuffer;

    protected async throwIfCannotBeCertified(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const certification = transaction.data.asset.certification;

        // check issuer credentials
        // MUST BE THE FIRST CONTROL
        const authorized = unsCrypto.verifyIssuerCredentials(certification.payload.iss);
        if (!authorized) {
            throw new CertifiedDemandNotAllowedIssuerError(transaction.id, certification.payload.iss);
        }

        // ISSUER FOR CERTIFICATION (FORGE FACTORY)
        const [certificationResult, certificationPublicKeyOrError] = await checkAndfindPublicKeyIssuer(
            certification,
            walletManager,
            nftRepository(),
        );

        // check existence of certification issuer UNIK
        if (!certificationResult) {
            throw new CertifiedDemandIssuerNotFound(transaction.id, certificationPublicKeyOrError);
        }
        const certificationPublicKey = certificationPublicKeyOrError;

        // check certification signature
        const signer = this.getPayloadSigner(certification.payload);
        if (!signer.verify(certification.signature, certificationPublicKey)) {
            throw new NftCertificationBadSignatureError();
        }

        // Check the sub content generated from the "payload" of the transaction: the asset itself, without the "certification property"
        const certifiedContent = { ...transaction.data.asset } as INftMintDemand;
        const payloadHashBuffer = this.getPayloadHashBuffer(certifiedContent);
        if (payloadHashBuffer.getPayloadHashBuffer() !== certification.payload.sub) {
            throw new NftCertificationBadPayloadSubjectError();
        }
    }
}
