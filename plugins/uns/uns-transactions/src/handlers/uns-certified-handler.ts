import { State } from "@arkecosystem/core-interfaces";
import { Identities, Interfaces } from "@arkecosystem/crypto";
import {
    INftDemand,
    INftMintDemand,
    INftMintDemandCertificationPayload,
    IPayloadHashBuffer,
    IPayloadSigner,
    unsCrypto,
} from "@uns/crypto";
import {
    CertifiedDemandNotAllowedIssuerError,
    IssuerNotFound,
    NftCertificationBadPayloadSubjectError,
    NftCertificationBadSignatureError,
    NftTransactionParametersError,
} from "../errors";
import { checkAndGetPublicKey } from "./utils/helpers";

export abstract class CertifiedTransactionHandler {
    protected abstract getPayloadSigner(payload: INftMintDemandCertificationPayload): IPayloadSigner;
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
        let issuerPublicKey: string;
        try {
            issuerPublicKey = await checkAndGetPublicKey(certification.payload.iss, walletManager);
        } catch (error) {
            throw new IssuerNotFound(transaction.id, error.message);
        }

        // check certification signature
        const signer = this.getPayloadSigner(certification.payload);
        if (!signer.verify(certification.signature, issuerPublicKey)) {
            throw new NftCertificationBadSignatureError();
        }

        // Check the sub content generated from the "payload" of the transaction: the asset itself, without the "certification property"
        const certifiedContent = { ...transaction.data.asset } as INftMintDemand;
        const payloadHashBuffer = this.getPayloadHashBuffer(certifiedContent);
        if (payloadHashBuffer.getPayloadHashBuffer() !== certification.payload.sub) {
            throw new NftCertificationBadPayloadSubjectError();
        }
        // check certified service cost corresponds to transaction amount
        if (!certification.payload.cost.isEqualTo(transaction.data.amount)) {
            throw new NftTransactionParametersError("amount");
        }

        // check certified service payment recipient corresponds to transaction recipient
        if (transaction.data.recipientId !== Identities.Address.fromPublicKey(issuerPublicKey)) {
            throw new NftTransactionParametersError("recipient");
        }
    }

    protected applyCostToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.plus(transaction.data.amount);
    }

    protected revertCostToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
