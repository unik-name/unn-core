import { color } from "@oclif/color";
import { Command, flags } from "@oclif/command";
import { Client, configManager, constants, ITransactionData } from "@uns/crypto";
import cli from "cli-ux";
import delay from "delay";
import * as req from "request-promise";
import { FINGERPRINT_API, NETWORKS } from "../config";

export class CreateUnikCommand extends Command {
    public static description = "Create UNIK token";

    public static examples = [
        `$ uns create-unik --explicitValue {explicitValue} --type [individual|corporate] [--network [mainnet|devnet|testnet|local]]`,
    ];

    public static flags = {
        help: flags.help({ char: "h" }),
        explicitValue: flags.string({ description: "UNIK nft token explicit value", required: true }),
        type: flags.string({
            description: "UNIK nft type (individual/corporate)",
            required: true,
            options: ["individual", "corporate"],
        }),
        network: flags.string({
            description: "Network used to create UNIK nft token (testnet and local are for development only)",
            options: ["mainnet", "devnet", "testnet", "local"],
        }),
    };
    private network: any;

    public async run() {
        const { flags } = this.parse(CreateUnikCommand);

        /**
         * Configuration
         */
        const networkName: string = flags.network ? flags.network.toLowerCase() : "mainnet";

        this.network = {
            ...NETWORKS[networkName],
            name: networkName,
        };

        const client: Client = new Client(configManager.getPreset(this.network.preset || this.network.name));
        const netWorkConfiguration: any = await this.getRemoteNeworkConfiguration(this.network.url);
        this.network.explorer = netWorkConfiguration.explorer;

        if (netWorkConfiguration.errorMsg) {
            this.promptErrAndExit(netWorkConfiguration.errorMsg);
        }

        /**
         * Get passphrase
         */
        const passphrase = await cli.prompt("Enter your wallet passphrase (12 words phrase)", { type: "mask" });

        /**
         * Compute Fingerprint
         */
        cli.action.start("Computing UNIK fingerprint");
        const tokenId = await this.computeTokenId(this.network.backend, flags.explicitValue, flags.type);
        cli.action.stop();

        if (tokenId.errorMsg) {
            this.promptErrAndExit(tokenId.errorMsg);
        }

        /**
         * Transaction creation
         */
        cli.action.start("Creating transaction");
        const transaction: ITransactionData = this.createTransaction(
            client,
            tokenId,
            passphrase,
            netWorkConfiguration.version,
        );

        cli.action.stop();

        /**
         * Transaction broadcast
         */
        cli.action.start("Sending transaction");
        const sendResult = await this.sendTransaction(transaction, this.network.url);
        cli.action.stop();

        if (sendResult.errorMsg) {
            this.promptErrAndExit(sendResult.errorMsg);
        }

        /**
         * Wait for the first transaction confirmation (2 blocktimes max)
         */
        cli.action.start("Waiting for transaction confirmation");
        const transactionFromNetwork = await this.waitTransactionFirstConfirmation(
            netWorkConfiguration.constants.blocktime,
            transaction,
            this.network,
        );
        cli.action.stop();

        if (transactionFromNetwork.errorMsg) {
            this.promptErrAndExit(transactionFromNetwork.errorMsg);
        }

        /**
         * Result prompt
         */
        const transactionUrl = color.cyanBright(`${this.network.explorer}/transaction/${transaction.id}`);
        if (transactionFromNetwork) {
            const tokenUrl = color.cyanBright(
                `${this.network.explorer}/uniks/${transactionFromNetwork.asset.nft.tokenId}`,
            );
            const confirmations = color.green(`${transactionFromNetwork.confirmations} confirmation(s)`);
            this.log(
                `UNIK nft created (${confirmations}): ${transactionFromNetwork.asset.nft.tokenId} [ ${tokenUrl} ]`,
            );
            this.log(`See transaction in explorer: ${transactionUrl}`);
        } else {
            this.log(
                `Transaction not found yet, the network can be slow. Check this url in a while: ${transactionUrl}`,
            );
        }
    }

    private getRemoteNeworkConfiguration(networkUrl: string) {
        return req
            .get(`${networkUrl}/api/v2/node/configuration`)
            .then(configResponse => {
                return JSON.parse(configResponse).data;
            })
            .catch(e => {
                return { errorMsg: "[create-unik] Error fetching network configuration" };
            });
    }

    /**
     * Provides UNIK nft fingerprint from type and explicit value
     * @param networkName
     * @param explicitValue
     * @param type
     */
    private computeTokenId(backendUrl: string, explicitValue: string, type: string) {
        const fingerprintUrl = backendUrl + FINGERPRINT_API;
        const fingerPrintBody = {
            type,
            explicitIdentifier: explicitValue,
        };

        const requestOptions = {
            body: fingerPrintBody,
            headers: {
                "Content-Type": "application/json",
                "api-version": 2,
            },
            json: true,
        };

        return req
            .post(fingerprintUrl, requestOptions)
            .then(unikFingerprintResponse => {
                return unikFingerprintResponse.result;
            })
            .catch(e => {
                return { errorMsg: `[create-unik] error computing  UNIK id. Caused by ${e.message}` };
            });
    }

    /**
     * Create transaction structure
     * @param client
     * @param tokenId
     * @param passphrase
     * @param networkVerion
     */
    private createTransaction(
        client: Client,
        tokenId: string,
        passphrase: string,
        networkVerion: number,
    ): ITransactionData {
        return client
            .getBuilder()
            .nftTransfer(tokenId)
            .fee(this.toSatoshi(client.getFeeManager().get(constants.TransactionTypes.NftTransfer)))
            .network(networkVerion)
            .sign(passphrase)
            .getStruct();
    }

    /**
     * Broadcast transaction
     * @param transaction
     * @param networkUrl
     */
    private async sendTransaction(transaction: ITransactionData, networkUrl: string): Promise<any> {
        const requestOptions = {
            body: {
                transactions: [transaction],
            },
            headers: {
                "api-version": 2,
                "Content-Type": "application/json",
            },
            json: true,
        };

        return req
            .post(`${networkUrl}/api/v2/transactions`, requestOptions)
            .then(resp => {
                const result: any = {};
                if (resp.errors) {
                    result.errorMsg = `[creat-unik] Transaction not accepted. Caused by: ${JSON.stringify(
                        resp.errors,
                    )}`;
                }
                return result;
            })
            .catch(e => {
                return { errorMsg: "[creat-unik] Technical error. Please retry" };
            });
    }

    /**
     * Tries to get transaction after delay and returns it.
     * @param networkUrl
     * @param transactionId
     * @param msdelay
     */
    private async getTransactionAfterDelay(networkUrl: string, transactionId: string, msdelay: number): Promise<any> {
        await delay(msdelay);
        return req
            .get(`${networkUrl}/api/v2/transactions/${transactionId}`)
            .then(transactionResponse => {
                return JSON.parse(transactionResponse).data;
            })
            .catch(e => {
                return { errorMsg: `[create-unik] ${e.message}` };
            });
    }

    /**
     *
     * @param blockTime Wait until transaction has at least 1 confirmation
     * @param transactionId
     * @param networkUrl
     */
    private async waitTransactionFirstConfirmation(blockTime: number, transaction: ITransactionData, network: any) {
        let transactionFromNetwork = await this.getTransactionAfterDelay(network.url, transaction.id, blockTime * 1000);
        if (!transactionFromNetwork || transactionFromNetwork.confirmations === 0) {
            transactionFromNetwork = await this.getTransactionAfterDelay(network.url, transaction.id, blockTime * 1000);
        }
        return transactionFromNetwork;
    }

    // UTILS

    /**
     *
     * @param value Transform value to satoshi number
     */
    private toSatoshi(value: number): string {
        return `${value * 100000000}`;
    }

    /**
     *
     * @param errorMsg Prompt error and exit command.
     */
    private promptErrAndExit(errorMsg: string): void {
        this.error(errorMsg);
        this.exit(1);
    }
}
