import { NFT, State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler, nftRepository } from "@uns/core-nft";
import {
    CertifiedNftMintTransaction,
    INftMintDemand,
    NftMintDemandCertificationSigner,
    NftMintDemandPayloadHashBuffer,
    unsCrypto,
} from "@uns/crypto";
import {
    CertifiedDemandIssuerNotFound,
    CertifiedDemandNotAllowedIssuerError,
    NftMintCertificationBadPayloadSubjectError,
    NftMintCertificationBadSignatureError,
} from "../errors";
import { checkAndfindPublicKeyIssuer } from "./utils/helpers";

export class CertifiedNftMintTransactionHandler extends NftMintTransactionHandler {
    public async isActivated(): Promise<boolean> {
        return true;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NftMintTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return CertifiedNftMintTransaction;
    }

    private get nftsRepository(): NFT.INftsRepository {
        return nftRepository();
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.throwIfCannotBeApplied(transaction, wallet, walletManager);

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
            this.nftsRepository,
        );
        // check existence of certification issuer UNIK
        if (!certificationResult) {
            throw new CertifiedDemandIssuerNotFound(transaction.id, certificationPublicKeyOrError);
        }
        const certificationPublicKey = certificationPublicKeyOrError;

        // check certification signature
        const signer = new NftMintDemandCertificationSigner(certification.payload);
        if (!signer.verify(certification.signature, certificationPublicKey)) {
            throw new NftMintCertificationBadSignatureError();
        }

        // Check the sub content generated from the "payload" of the transaction: the asset itself, without the "certification property"
        const certifiedContent = { ...transaction.data.asset } as INftMintDemand;
        const payloadHashBuffer = new NftMintDemandPayloadHashBuffer(certifiedContent);
        if (payloadHashBuffer.getPayloadHashBuffer() !== certification.payload.sub) {
            throw new NftMintCertificationBadPayloadSubjectError();
        }
    }
}
