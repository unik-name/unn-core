import { color } from "@oclif/color";
import { flags } from "@oclif/command";
import { ITransactionData } from "@uns/crypto";
import cli from "cli-ux";
import { BaseCommand } from "../baseCommand";
import { getUnikTypesList, UNIK_TYPES } from "../types";
import { createNFTMintTransaction, getNetworksListListForDescription } from "../utils";

export class CreateUnikCommand extends BaseCommand {
    public static description = "Create UNIK token";

    public static examples = [
        `$ uns create-unik --explicitValue {explicitValue} --type [${getUnikTypesList().join(
            "|",
        )}] --network ${getNetworksListListForDescription()}`,
    ];

    public static flags = {
        ...BaseCommand.baseFlags,
        explicitValue: flags.string({ description: "UNIK nft token explicit value", required: true }),
        type: flags.string({
            description: "UNIK nft type",
            required: true,
            options: getUnikTypesList(),
        }),
    };

    protected getCommand(): any {
        return CreateUnikCommand;
    }

    protected getCommandTechnicalName(): string {
        return "create-unik";
    }

    protected async do(flags: Record<string, any>) {
        /**
         * Get passphrase
         */
        const passphrase = await cli.prompt("Enter your wallet passphrase (12 words phrase)", { type: "mask" });

        /**
         * Compute Fingerprint
         */
        cli.action.start("Computing UNIK fingerprint");
        const tokenId = await this.api.computeTokenId(this.api.network.backend, flags.explicitValue, flags.type);
        cli.action.stop();

        /**
         * Transaction creation
         */
        cli.action.start("Creating transaction");
        const transaction: ITransactionData = createNFTMintTransaction(
            this.client,
            tokenId,
            this.getTypeValue(flags.type),
            passphrase,
            this.api.getVersion(),
        );

        cli.action.stop();

        /**
         * Transaction broadcast
         */
        cli.action.start("Sending transaction");
        await this.api.sendTransaction(transaction);
        cli.action.stop();

        /**
         * Wait for the first transaction confirmation (2 blocktimes max)
         */
        cli.action.start("Waiting for transaction confirmation");
        const transactionFromNetwork = await this.waitTransactionFirstConfirmation(
            this.api.getBlockTime(),
            transaction,
            this.api.network,
        );
        cli.action.stop();

        /**
         * Result prompt
         */
        const transactionUrl = color.cyanBright(`${this.api.getExplorerUrl()}/transaction/${transaction.id}`);
        if (transactionFromNetwork) {
            const tokenUrl = color.cyanBright(`${this.api.getExplorerUrl()}/uniks/${tokenId}`);
            const confirmations = color.green(`${transactionFromNetwork.confirmations} confirmation(s)`);
            this.log(`UNIK nft created (${confirmations}): ${tokenId} [ ${tokenUrl} ]`);
            this.log(`See transaction in explorer: ${transactionUrl}`);
        } else {
            this.log(
                `Transaction not found yet, the network can be slow. Check this url in a while: ${transactionUrl}`,
            );
        }
    }

    /**
     *
     * @param blockTime Wait until transaction has at least 1 confirmation
     * @param transactionId
     * @param networkUrl
     */
    private async waitTransactionFirstConfirmation(blockTime: number, transaction: ITransactionData, network: any) {
        let transactionFromNetwork = await this.api.getTransaction(transaction.id, blockTime * 1000);
        if (!transactionFromNetwork || transactionFromNetwork.confirmations === 0) {
            transactionFromNetwork = await this.api.getTransaction(transaction.id, blockTime * 1000);
        }
        return transactionFromNetwork;
    }

    private getTypeValue(tokenType): string {
        return `${UNIK_TYPES[tokenType].code}`;
    }
}
