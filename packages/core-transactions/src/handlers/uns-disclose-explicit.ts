import { app } from "@arkecosystem/core-container";
import { Database, TransactionPool } from "@arkecosystem/core-interfaces";
import {
    DiscloseExplicitTransaction,
    ITransactionData,
    Transaction,
    TransactionConstructor,
    unsCrypto,
} from "@arkecosystem/crypto";
import { DiscloseDemand, DiscloseDemandCertification } from "@arkecosystem/crypto";
import {
    DiscloseDemandAlreadyExistsError,
    DiscloseDemandCertificationSignatureError,
    DiscloseDemandIssuerError,
    DiscloseDemandSignatureError,
    DiscloseDemandSubInvalidError,
    NftOwnerError,
} from "../errors";
import { TransactionHandler } from "./transaction";

export class UNSDiscloseExplicitTransactionHandler extends TransactionHandler {
    public getConstructor(): TransactionConstructor {
        return DiscloseExplicitTransaction;
    }

    /**
     * Check if the transaction can be applied to the wallet.
     */

    public async canBeApplied(
        transaction: Transaction,
        wallet: Database.IWallet,
        walletManager?: Database.IWalletManager,
    ): Promise<boolean> {
        const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
        const discloseDemand: DiscloseDemand = transaction.data.asset["disclose-demand"];
        const discloseDemandCertif: DiscloseDemandCertification =
            transaction.data.asset["disclose-demand-certification"];

        const certificationIssuerNft = await databaseService.nftsBusinessRepository.findById(
            discloseDemandCertif.payload.iss,
        );
        // check existence of certification issuer UNIK
        if (!certificationIssuerNft) {
            throw new DiscloseDemandIssuerError();
        }
        // retrieve certification issuer public key
        // could be retrieved from walletManager. To be changed when walletManager will be available anytime in ark 2.6
        const certificationIssuerPublicKey = await databaseService.transactionsBusinessRepository.getPublicKeyFromAddress(
            certificationIssuerNft.ownerId,
        );
        const demandIssuerNft = await databaseService.nftsBusinessRepository.findById(discloseDemand.payload.iss);
        // check existence of demand issuer UNIK
        if (!demandIssuerNft) {
            throw new DiscloseDemandIssuerError();
        }
        // retrieve demand issuer public key
        const demandIssuerPublicKey = await databaseService.transactionsBusinessRepository.getPublicKeyFromAddress(
            demandIssuerNft.ownerId,
        );
        // check issuer credentials
        if (!unsCrypto.verifyIssuerCredentials(discloseDemandCertif.payload.iss)) {
            throw new DiscloseDemandIssuerError();
        }
        // check disclose demand certification signature
        if (
            !unsCrypto.verifyPayload(
                discloseDemandCertif.payload,
                discloseDemandCertif.signature,
                certificationIssuerPublicKey,
            )
        ) {
            throw new DiscloseDemandCertificationSignatureError();
        }
        // check disclose demand signature correspond to issuer public key
        if (!unsCrypto.verifyPayload(discloseDemand.payload, discloseDemand.signature, demandIssuerPublicKey)) {
            throw new DiscloseDemandSignatureError();
        }
        // check disclose demand certification sub
        const sub: string = unsCrypto.getPayloadHashBuffer(discloseDemand.payload).toString("hex");
        if (sub !== discloseDemandCertif.payload.sub) {
            throw new DiscloseDemandSubInvalidError();
        }
        // check if transaction already exists
        const demandsTx = await databaseService.transactionsBusinessRepository.findAllByAsset({
            ["disclose-demand-certification"]: {
                payload: {
                    sub: discloseDemandCertif.payload.sub,
                },
            },
        });
        if (demandsTx && demandsTx.length > 0) {
            throw new DiscloseDemandAlreadyExistsError(transaction.id);
        }

        // check token ownership
        if (!wallet.tokens.includes(discloseDemand.payload.sub)) {
            throw new NftOwnerError(wallet.address, discloseDemand.payload.sub);
        }
        return super.canBeApplied(transaction, wallet, walletManager);
    }

    /**
     * Apply the transaction to the wallet.
     */
    public async apply(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        // action delegated to the nft manager
        // TODO:
    }

    /**
     * Revert the transaction from the wallet.
     */
    public async revert(transaction: Transaction, wallet: Database.IWallet): Promise<void> {
        // cannot get back property value...
        // TODO:
    }
    public async canEnterTransactionPool(data: ITransactionData, guard: TransactionPool.IGuard): Promise<boolean> {
        return !(await this.typeFromSenderAlreadyInPool(data, guard));
    }
}
