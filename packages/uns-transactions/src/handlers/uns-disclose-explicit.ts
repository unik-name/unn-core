import { app } from "@arkecosystem/core-container";
import { ConnectionManager } from "@arkecosystem/core-database";
import { Database, NFT, State, TransactionPool } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftOwnerError, nftRepository } from "@uns/core-nft";
import { DiscloseExplicitTransaction, IDiscloseDemand, IDiscloseDemandCertification, unsCrypto } from "@uns/crypto";
import {
    DiscloseDemandAlreadyExistsError,
    DiscloseDemandCertificationSignatureError,
    DiscloseDemandIssuerError,
    DiscloseDemandSignatureError,
    DiscloseDemandSubInvalidError,
} from "../errors";

export class DiscloseExplicitTransactionHandler extends Handlers.TransactionHandler {
    private get nftsRepository(): NFT.INftsRepository {
        return nftRepository();
    }

    public getConstructor(): Transactions.TransactionConstructor {
        return DiscloseExplicitTransaction;
    }

    public dependencies(): ReadonlyArray<Handlers.TransactionHandlerConstructor> {
        return [];
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

        const certificationIssuerNft = await this.nftsRepository.findById(discloseDemandCertif.payload.iss);
        // check existence of certification issuer UNIK
        if (!certificationIssuerNft) {
            throw new DiscloseDemandIssuerError();
        }
        const certificationIssuerPublicKey = walletManager.findByAddress(certificationIssuerNft.ownerId)?.publicKey;

        const demandIssuerNft = await this.nftsRepository.findById(discloseDemand.payload.iss);
        // check existence of demand issuer UNIK
        if (!demandIssuerNft) {
            throw new DiscloseDemandIssuerError();
        }
        // retrieve demand issuer public key
        const demandIssuerPublicKey = walletManager.findByAddress(demandIssuerNft.ownerId)?.publicKey;

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
        if (
            (await this.nftsRepository.findPropertyByKey(discloseDemand.payload.sub, "explicitValues")) &&
            (await this.isTransactionsWithSameSubExists(discloseDemandCertif.payload.sub))
        ) {
            throw new DiscloseDemandAlreadyExistsError(transaction.id);
        }

        // check token ownership
        if (
            wallet.hasAttribute("tokens") &&
            !wallet.getAttribute("tokens").tokens.includes(discloseDemand.payload.sub)
        ) {
            throw new NftOwnerError(wallet.address, discloseDemand.payload.sub);
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async canEnterTransactionPool(
        data: Interfaces.ITransactionData,
        pool: TransactionPool.IConnection,
        processor: TransactionPool.IProcessor,
    ): Promise<boolean> {
        return !(await this.typeFromSenderAlreadyInPool(data, pool, processor));
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
        if (currentValues?.value) {
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
