import { ITransactionData } from "@uns/crypto";
import delay from "delay";
import * as req from "request-promise";
import { FINGERPRINT_API } from "./config";
import * as UTILS from "./utils";

export class UNSCLIAPI {
    public network: any;

    constructor(networkPreset) {
        this.network = {
            ...networkPreset.network,
            ...UTILS.getNetwork(networkPreset.network.name),
            ...this.getLastInfosFromMilestones(networkPreset.milestones),
        };
    }

    /**
     * Broadcast transaction
     * @param transaction
     * @param networkUrl
     */
    public async sendTransaction(transaction: ITransactionData): Promise<any> {
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
            .post(`${this.network.url}/api/v2/transactions`, requestOptions)
            .then(resp => {
                const result: any = {};
                if (resp.errors) {
                    result.errorMsg = `Transaction not accepted. Caused by: ${JSON.stringify(resp.errors)}`;
                }
                return result;
            })
            .catch(e => {
                throw new Error("Technical error. Please retry");
            });
    }

    /**
     * Tries to get transaction after delay and returns it.
     * @param transactionId
     * @param msdelay
     */
    public async getTransaction(transactionId: string, msdelay: number = 0): Promise<any> {
        await delay(msdelay);
        return req
            .get(`${this.network.url}/api/v2/transactions/${transactionId}`)
            .then(transactionResponse => {
                const transactionResp = JSON.parse(transactionResponse);
                return {
                    ...transactionResp.data,
                    chainmeta: transactionResp.chainmeta,
                };
            })
            .catch(e => {
                if (e.statusCode === 404) {
                    return undefined;
                }
                throw new Error(`Error fetching transaction  ${transactionId}. Caused by: ${e.message}`);
            });
    }

    /**
     * Provides UNIK nft fingerprint from type and explicit value
     * @param networkName
     * @param explicitValue
     * @param type
     */
    public async computeTokenId(backendUrl: string, explicitValue: string, type: string) {
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
                throw new Error(`Error computing  UNIK id. Caused by ${e.message}`);
            });
    }

    /**
     * Get Wallet by address.
     * @param unikid
     */
    public async getUnikById(unikid: string) {
        return req
            .get(`${this.network.url}/api/v2/nfts/${unikid}`)
            .then(res => {
                const unikResponse = JSON.parse(res);
                return {
                    ...unikResponse.data,
                    chainmeta: unikResponse.chainmeta,
                };
            })
            .catch(e => {
                const error =
                    e.statusCode === 404
                        ? `No UNIK token found with id ${unikid}.`
                        : `Error fetching UNIK token ${unikid}. Caused by ${e.message}`;
                throw new Error(error);
            });
    }

    /**
     *
     * @param unikid Get UNIK token properties
     */
    public async getUnikProperties(unikid: string): Promise<any> {
        return req
            .get(`${this.network.url}/api/v2/nfts/${unikid}/properties`)
            .then(res => {
                return JSON.parse(res);
            })
            .catch(e => {
                const error =
                    e.statusCode === 404
                        ? `No properties for UNIK token ${unikid} found.`
                        : `Error fetching UNIK token ${unikid} properties. Caused by ${e.message}`;
                throw new Error(error);
            });
    }

    /**
     * Get count of UNIKs
     */
    public async getUniks() {
        return req
            .get(`${this.network.url}/api/v2/nfts`)
            .then(resp => {
                return JSON.parse(resp).meta.totalCount;
            })
            .catch(e => {
                throw new Error(`Error fetching UNIKs.. Caused by ${e}`);
            });
    }

    /**
     * Get Wallet by address or public key.
     * @param walletIdentifier
     */
    public async getWallet(walletIdentifier: string): Promise<any> {
        return req
            .get(`${this.network.url}/api/v2/wallets/${walletIdentifier}`)
            .then(res => {
                const walletResponse = JSON.parse(res);
                return {
                    ...walletResponse.data,
                    chainmeta: walletResponse.chainmeta,
                };
            })
            .catch(e => {
                const error =
                    e.statusCode === 404
                        ? `No wallet found with id ${walletIdentifier}.`
                        : `Error fetching wallet ${walletIdentifier}. Caused by ${e.message}`;
                throw new Error(error);
            });
    }

    /**
     * Get total (D)UNS supply.
     */
    public async getSupply() {
        return req
            .get(`${this.network.url}/api/blocks/getSupply`)
            .then(resp => {
                return JSON.parse(resp).supply;
            })
            .catch(e => {
                throw new Error(`Error fetching supply. Caused by ${e}`);
            });
    }

    /**
     * Get the current blockchain height
     */
    public async getCurrentHeight() {
        return req
            .get(`${this.network.url}/api/v2/node/status`)
            .then(resp => {
                return JSON.parse(resp).data.now;
            })
            .catch(e => {
                throw new Error(`Error fetching status.. Caused by ${e}`);
            });
    }

    /**
     * Get current node URL
     */
    public getCurrentNode() {
        return this.network.url;
    }

    /**
     * Get token name
     */
    public getToken() {
        return this.network.client.token;
    }

    /**
     * Get network active delegates
     */
    public getActiveDelegates() {
        return this.network.activeDelegates;
    }

    /**
     * Get network block time interval
     */
    public getBlockTime() {
        return this.network.blocktime;
    }

    /**
     * Get network node version
     */
    public getVersion() {
        return this.network.client.pubKeyHash;
    }

    public getExplorerUrl() {
        return this.network.client.explorer;
    }

    /**
     * Get last configuration from milestones
     * @param milestones
     */
    private getLastInfosFromMilestones(milestones: any[]): any {
        const infos: any = {};
        for (const { activeDelegates, blocktime } of milestones) {
            if (!infos.activeDelegates && activeDelegates) {
                infos.activeDelegates = activeDelegates;
            }
            if (!infos.blocktime && blocktime) {
                infos.blocktime = blocktime;
            }
            if (infos.activeDelegates && infos.blocktime) {
                break;
            }
        }
        return infos;
    }
}
