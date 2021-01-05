import { app } from "@arkecosystem/core-container";
import { ConnectionManager } from "@arkecosystem/core-database";
import { Database, NFT, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler, NftOwnerError, nftRepository } from "@uns/core-nft";
import { DiscloseExplicitTransaction, IDiscloseDemand, IDiscloseDemandCertification, unsCrypto } from "@uns/crypto";
import {
    CertifiedDemandIssuerNotFound,
    CertifiedDemandNotAllowedIssuerError,
    DiscloseDemandAlreadyExistsError,
    DiscloseDemandCertificationSignatureError,
    DiscloseDemandSignatureError,
    DiscloseDemandSubInvalidError,
    IssuerNotFound,
} from "../errors";
import { EXPLICIT_PROP_KEY, getUnikOwner, revertExplicitValue, setExplicitValue } from "./utils";

export class DiscloseExplicitTransactionHandler extends Handlers.TransactionHandler {
    private get nftsRepository(): NFT.INftsRepository {
        return nftRepository();
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return DiscloseExplicitTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [NftMintTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const discloseDemand: IDiscloseDemand = transaction.data.asset["disclose-demand"];
        const discloseDemandCertif: IDiscloseDemandCertification =
            transaction.data.asset["disclose-demand-certification"];

        // check certification issuer credentials
        // MUST BE DONE FIRST
        const authorized = unsCrypto.verifyIssuerCredentials(discloseDemandCertif.payload.iss);
        if (!authorized) {
            throw new CertifiedDemandNotAllowedIssuerError(transaction.id, discloseDemandCertif.payload.iss);
        }

        // ISSUER FOR CERTIFICATION (FORGE FACTORY)
        let forgeFactoryPublicKey: string;
        try {
            forgeFactoryPublicKey = await getUnikOwner(discloseDemandCertif.payload.iss);
        } catch (error) {
            throw new IssuerNotFound(transaction.id, error.message);
        }

        // ISSUER FOR DEMAND (CLIENT)
        let demandPublicKey: string;
        try {
            demandPublicKey = await getUnikOwner(discloseDemand.payload.iss);
        } catch (error) {
            throw new CertifiedDemandIssuerNotFound(transaction.id, error.message);
        }

        // check disclose demand certification signature
        if (
            !unsCrypto.verifyPayload(
                discloseDemandCertif.payload,
                discloseDemandCertif.signature,
                forgeFactoryPublicKey,
            )
        ) {
            throw new DiscloseDemandCertificationSignatureError();
        }

        // check disclose demand signature correspond to issuer public key
        if (!unsCrypto.verifyPayload(discloseDemand.payload, discloseDemand.signature, demandPublicKey)) {
            throw new DiscloseDemandSignatureError();
        }

        // check disclose demand certification sub
        const sub: string = unsCrypto.getPayloadHashBuffer(discloseDemand.payload).toString("hex");
        if (sub !== discloseDemandCertif.payload.sub) {
            throw new DiscloseDemandSubInvalidError();
        }

        // check if transaction already exists
        if (
            (await this.nftsRepository.findPropertyByKey(discloseDemand.payload.sub, EXPLICIT_PROP_KEY)) &&
            (await this.isTransactionsWithSameSubExists(discloseDemandCertif.payload.sub))
        ) {
            throw new DiscloseDemandAlreadyExistsError(transaction.id);
        }

        // check token ownership
        if (
            wallet.hasAttribute("tokens") &&
            !Object.keys(wallet.getAttribute("tokens")).includes(discloseDemand.payload.sub)
        ) {
            throw new NftOwnerError(wallet, discloseDemand.payload.sub);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<{ type: string; message: string } | null> {
        return this.typeFromSenderAlreadyInPool(data, pool);
    }

    // tslint:disable-next-line: no-empty
    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {}

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);
        if (updateDb) {
            await setExplicitValue(transaction);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        if (updateDb) {
            await revertExplicitValue(transaction.data);
        }
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    // TODO : uns: Optimization (with the NFTMint transaction date)
    private async isTransactionsWithSameSubExists(discloseDemandId: string): Promise<boolean> {
        const reader: TransactionReader = await TransactionReader.create(
            app.resolvePlugin<ConnectionManager>("database-manager").connection(),
            this.getConstructor(),
        );

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const discloseDemandCertif: IDiscloseDemandCertification =
                    transaction?.asset["disclose-demand-certification"];
                if (discloseDemandCertif?.payload?.sub === discloseDemandId) {
                    return true;
                }
            }
        }
        return false;
    }
}
