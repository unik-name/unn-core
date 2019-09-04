import { color } from "@oclif/color";
import { flags } from "@oclif/command";
import { ITransactionData } from "@uns/crypto";
import cli from "cli-ux";
import { BaseCommand } from "../baseCommand";
import { getUnikTypesList, UNIK_TYPES } from "../types";
import {
    createNFTMintTransaction,
    getNetworksListListForDescription,
    getPassphraseFromUser,
    passphraseFlag,
} from "../utils";

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
        ...passphraseFlag,
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
        let passphrase = flags.passphrase;
        if (!passphrase) {
            passphrase = await getPassphraseFromUser();
        }

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
        const sendResult = await this.api.sendTransaction(transaction);
        cli.action.stop();
        if (sendResult.errors) {
            throw new Error(`Transaction not accepted. Caused by: ${JSON.stringify(sendResult.errors)}`);
        }

        /**
         * Wait for the first transaction confirmation (2 blocktimes max)
         */
        cli.action.start("Waiting for transaction confirmation");
        const transactionFromNetwork = await this.waitTransactionConfirmations(
            this.api.getBlockTime(),
            transaction.id,
            1,
            1,
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

    private getTypeValue(tokenType): string {
        return `${UNIK_TYPES[tokenType].code}`;
    }
}
