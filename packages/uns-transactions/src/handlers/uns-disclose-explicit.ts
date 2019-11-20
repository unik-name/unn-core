import { app } from "@arkecosystem/core-container";
import { ConnectionManager, NftsBusinessRepository } from "@arkecosystem/core-database";
import { Database, EventEmitter, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftOwnerError, NftTransactionHandler } from "@uns/core-nft";
import { IDiscloseDemand, IDiscloseDemandCertification, unsCrypto, unsTransactionGroup, unsTransactions, UnsTransactionType } from "@uns/crypto";
import { DiscloseDemandAlreadyExistsError, DiscloseDemandCertificationSignatureError, DiscloseDemandIssuerError, DiscloseDemandSignatureError, DiscloseDemandSubInvalidError } from "../errors";
import { UNSApplicationEvents } from "../events";

export class DiscloseExplicitTransactionHandler extends NftTransactionHandler {

    private nftsRepository: NftsBusinessRepository = new NftsBusinessRepository(app.resolvePlugin<ConnectionManager>("database-manager").connection());

    public getConstructor(): Transactions.TransactionConstructor {
        return unsTransactions.DiscloseExplicitTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {

        const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
        const discloseDemand: IDiscloseDemand = transaction.data.asset["disclose-demand"];
        const discloseDemandCertif: IDiscloseDemandCertification =
            transaction.data.asset["disclose-demand-certification"];

        const certificationIssuerNft = await this.nftsRepository.findById(
            discloseDemandCertif.payload.iss,
        );
        // check existence of certification issuer UNIK
        if (!certificationIssuerNft) {
            throw new DiscloseDemandIssuerError();
        }
        // retrieve certification issuer public key
        // could be retrieved from walletManager. To be changed when walletManager will be available anytime in ark 2.6
        const certificationIssuerPublicKey = databaseService.transactionsBusinessRepository.getPublicKeyFromAddress(
            certificationIssuerNft.ownerId,
        );
        const demandIssuerNft = await this.nftsRepository.findById(discloseDemand.payload.iss);
        // check existence of demand issuer UNIK
        if (!demandIssuerNft) {
            throw new DiscloseDemandIssuerError();
        }
        // retrieve demand issuer public key
        const demandIssuerPublicKey = databaseService.transactionsBusinessRepository.getPublicKeyFromAddress(
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
        if ((await this.nftsRepository.findProperty(discloseDemand.payload.sub, "explicitValues"))
            && (await this.isTransactionsWithSameSubExists(discloseDemandCertif.payload.sub))) {
            throw new DiscloseDemandAlreadyExistsError(transaction.id);
        }

        // check token ownership
        if (!wallet.getAttribute("tokens").tokens.includes(discloseDemand.payload.sub)) {
            throw new NftOwnerError(wallet.address, discloseDemand.payload.sub);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        if (
            await pool.senderHasTransactionsOfType(
                data.senderPublicKey,
                UnsTransactionType.UnsDiscloseExplicit,
                unsTransactionGroup,
            )
        ) {
            processor.pushError(
                data,
                "ERR_PENDING",
                `UNS Disclose Explicit Values NFT "${data.senderPublicKey}" already in the pool`,
            );
            return false;
        }

        return true;
    }

    public emitEvents(transaction: Interfaces.ITransaction, emitter: EventEmitter.EventEmitter): void {
        emitter.emit(UNSApplicationEvents.UnsDiscloseExplicit, transaction.data);
    }

    // tslint:disable-next-line: no-empty
    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {}

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {

        await super.applyToSender(transaction, walletManager);

        const tokenId = transaction.data.asset["disclose-demand"].payload.sub;
        const explicitValues = transaction.data.asset["disclose-demand"].payload.explicitValue;

        const nftManager = app.resolvePlugin("core-nft");

        const currentValues = await nftManager.getProperty(tokenId, "explicitValues");
        if (currentValues && currentValues.value) {
            const currentValuesArray = currentValues.value.split(",");
            const newValues = explicitValues.filter(explicitVal => {
                return !currentValuesArray.includes(explicitVal);
            });
            if (newValues.length) {
                return nftManager.updateProperty(
                    "explicitValues",
                    currentValues.value + "," + newValues.join(","),
                    tokenId,
                );
            }
        } else {
            if (explicitValues.length) {
                return nftManager.insertProperty("explicitValues", explicitValues.join(","), tokenId);
            }
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
    }

    public async applyToRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        return;
    }

    public async revertForRecipient(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        return;
    }

    private getConnection(): Database.IConnection {
        return app.resolvePlugin<ConnectionManager>("database-manager").connection();
    }

    // TODO : uns: Optimization (with the NFTMint transaction date)
    private async isTransactionsWithSameSubExists(discloseDemandId: string): Promise<boolean> {
        const reader: TransactionReader = await TransactionReader.create(this.getConnection(), this.getConstructor());

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                const discloseDemandCertif: IDiscloseDemandCertification = transaction?.asset["disclose-demand-certification"];
                if (discloseDemandCertif?.payload?.sub === discloseDemandId) {
                    return true;
                }
            }
        }
        return false;
    }
}
