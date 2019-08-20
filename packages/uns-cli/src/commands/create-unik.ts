import { color } from "@oclif/color";
import { flags } from "@oclif/command";
import { Client, constants, ITransactionData } from "@uns/crypto";
import cli from "cli-ux";
import delay from "delay";
import * as req from "request-promise";
import { BaseCommand } from "../baseCommand";
import { FINGERPRINT_API } from "../config";

export class CreateUnikCommand extends BaseCommand {
    public static description = "Create UNIK token";

    public static examples = [
        `$ uns create-unik --explicitValue {explicitValue} --type [individual|corporate] --network [devnet|local]`,
    ];

    public static flags = {
        ...BaseCommand.baseFlags,
        explicitValue: flags.string({ description: "UNIK nft token explicit value", required: true }),
        type: flags.string({
            description: "UNIK nft type (individual/corporate)",
            required: true,
            options: ["individual", "corporate"],
        }),
    };

    protected getCommand(): any {
        return CreateUnikCommand;
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
        const tokenId = await this.computeTokenId(this.network.backend, flags.explicitValue, flags.type);
        cli.action.stop();

        /**
         * Transaction creation
         */
        cli.action.start("Creating transaction");
        const transaction: ITransactionData = this.createTransaction(
            this.client,
            tokenId,
            passphrase,
            this.netWorkConfiguration.version,
        );

        cli.action.stop();

        /**
         * Transaction broadcast
         */
        cli.action.start("Sending transaction");
        await this.sendTransaction(transaction, this.network.url);
        cli.action.stop();

        /**
         * Wait for the first transaction confirmation (2 blocktimes max)
         */
        cli.action.start("Waiting for transaction confirmation");
        const transactionFromNetwork = await this.waitTransactionFirstConfirmation(
            this.netWorkConfiguration.constants.blocktime,
            transaction,
            this.network,
        );
        cli.action.stop();

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
                throw new Error(`[create-unik] error computing  UNIK id. Caused by ${e.message}`);
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
                throw new Error("[creat-unik] Technical error. Please retry");
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
                throw new Error(`[create-unik] ${e.message}`);
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
}
