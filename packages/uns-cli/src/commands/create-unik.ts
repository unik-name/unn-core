import { flags } from "@oclif/command";
import { ITransactionData } from "@uns/crypto";
import { BaseCommand } from "../baseCommand";
import { BaseCommandLogs } from "../baseCommandLogs";
import { Formater, NestedCommandOutput, OUTPUT_FORMAT } from "../formater";
import { getTypeValue, getUnikTypesList } from "../types";
import {
    createNFTMintTransaction,
    getNetworksListListForDescription,
    getPassphraseFromUser,
    passphraseFlag,
} from "../utils";

export class CreateUnikCommand extends BaseCommandLogs {
    public static description = "Create UNIK token";

    public static examples = [
        `$ uns create-unik --explicitValue {explicitValue} --type [${getUnikTypesList().join(
            "|",
        )}] --network ${getNetworksListListForDescription()} --format {json|yaml}`,
    ];

    public static flags = {
        ...BaseCommandLogs.baseFlags,
        explicitValue: flags.string({ description: "UNIK nft token explicit value", required: true }),
        type: flags.string({
            description: "UNIK nft type",
            required: true,
            options: getUnikTypesList(),
        }),
        ...passphraseFlag,
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml];
    }

    protected getCommand(): typeof BaseCommand {
        return CreateUnikCommand;
    }

    protected getCommandTechnicalName(): string {
        return "create-unik";
    }

    protected async do(flags: Record<string, any>): Promise<NestedCommandOutput> {
        /**
         * Get passphrase
         */
        let passphrase = flags.passphrase;
        if (!passphrase) {
            passphrase = await getPassphraseFromUser();
        }

        /**
         * Compute Fingerprint
         */
        this.actionStart("Computing UNIK fingerprint");
        const tokenId = await this.api.computeTokenId(this.api.network.backend, flags.explicitValue, flags.type);
        this.actionStop();
        this.log(`unikid: ${tokenId}`);

        /**
         * Transaction creation
         */
        this.actionStart("Creating transaction");
        const transaction: ITransactionData = createNFTMintTransaction(
            this.client,
            tokenId,
            getTypeValue(flags.type),
            passphrase,
            this.api.getVersion(),
        );
        this.actionStop();
        this.log(`Transaction id: ${transaction.id}`);

        /**
         * Transaction broadcast
         */
        this.actionStart("Sending transaction");
        const sendResponse = await this.api.sendTransaction(transaction);
        this.actionStop();
        if (sendResponse.errors) {
            throw new Error(`Transaction not accepted. Caused by: ${JSON.stringify(sendResponse.errors)}`);
        }
        const transactionUrl = `${this.api.getExplorerUrl()}/transaction/${transaction.id}`;
        this.log(`Transaction in explorer: ${transactionUrl}`);

        /**
         * Wait for the first transaction confirmation (2 blocktimes max)
         */
        this.actionStart("Waiting for transaction confirmation");
        const transactionFromNetwork = await this.waitTransactionConfirmations(
            this.api.getBlockTime(),
            transaction.id,
            1,
            1,
        );
        this.actionStop();

        /**
         * Result prompt
         */
        if (transactionFromNetwork) {
            this.log(
                `UNIK nft forged:  ${transactionFromNetwork.confirmations} confirmation${
                    transactionFromNetwork.confirmations > 0 ? "s" : ""
                }`,
            );

            const tokenUrl = `${this.api.getExplorerUrl()}/nft/${tokenId}`;
            this.log(`UNIK nft in UNS explorer: ${tokenUrl}`);
        } else {
            this.error(
                `Transaction not found yet, the network can be slow. Check this url in a while: ${transactionUrl}`,
            );
        }
        return {
            data: {
                id: tokenId,
                transaction: transaction.id,
                confirmations: transactionFromNetwork.confirmations,
            },
        };
    }
}
