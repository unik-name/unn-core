import { Database, State } from "@arkecosystem/core-interfaces";
import { Identities, Interfaces, Utils } from "@arkecosystem/crypto";
import {
    DIDTypes,
    getRewardsFromDidType,
    INftDemand,
    INftDemandCertificationPayload,
    IUnsRewards,
    NftCertificationSigner,
    NftDemandHashBuffer,
    unsCrypto,
} from "@uns/crypto";
import {
    CertifiedDemandNotAllowedIssuerError,
    IssuerNotFound,
    NftCertificationBadPayloadSubjectError,
    NftCertificationBadSignatureError,
    NftTransactionParametersError,
} from "../errors";
import { getFoundationWallet, getUnikOwner } from "./utils/helpers";

export abstract class CertifiedTransactionHandler {
    public applyRewardsToFoundation(walletManager: State.IWalletManager, didType: DIDTypes, height?: number): void {
        const rewards: IUnsRewards = getRewardsFromDidType(didType, height);
        const foundationWallet = getFoundationWallet(walletManager);
        foundationWallet.balance = foundationWallet.balance.plus(Utils.BigNumber.make(rewards.foundation));
    }

    public revertRewardsForFoundation(walletManager: State.IWalletManager, didType: DIDTypes): void {
        const rewards: IUnsRewards = getRewardsFromDidType(didType);
        const foundationWallet = getFoundationWallet(walletManager);
        foundationWallet.balance = foundationWallet.balance.minus(Utils.BigNumber.make(rewards.foundation));
    }

    protected getPayloadSigner(payload: INftDemandCertificationPayload): NftCertificationSigner {
        return new NftCertificationSigner(payload);
    }

    protected getPayloadHashBuffer(demand: INftDemand): NftDemandHashBuffer {
        return new NftDemandHashBuffer(demand);
    }

    protected async throwIfCannotBeCertified(
        transaction: Interfaces.ITransaction,
        _: State.IWalletManager,
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
            issuerPublicKey = await getUnikOwner(certification.payload.iss);
        } catch (error) {
            throw new IssuerNotFound(transaction.id, error.message);
        }

        // check certification signature
        const signer = this.getPayloadSigner(certification.payload);
        if (!signer.verify(certification.signature, issuerPublicKey)) {
            throw new NftCertificationBadSignatureError();
        }

        // Check the sub content generated from the "payload" of the transaction: the asset itself, without the "certification property"
        const certifiedContent = { ...transaction.data.asset } as INftDemand;
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

    protected applyCostToRecipient(
        transaction: Interfaces.ITransactionData | Database.IBootstrapTransaction,
        walletManager: State.IWalletManager,
    ): void {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.recipientId);
        recipient.balance = recipient.balance.plus(transaction.amount);
    }

    protected revertCostToRecipient(transaction: Interfaces.ITransaction, walletManager: State.IWalletManager): void {
        const recipient: State.IWallet = walletManager.findByAddress(transaction.data.recipientId);
        recipient.balance = recipient.balance.minus(transaction.data.amount);
    }
}
