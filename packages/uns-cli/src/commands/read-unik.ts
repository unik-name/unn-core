import { flags } from "@oclif/command";
import * as req from "request-promise";
import { ReadCommand } from "../readCommand";

export class ReadUnikCommand extends ReadCommand {
    public static description = "Display UNIK token informations";

    public static examples = [`$ uns read-unik --unikid {unikId} --network [devnet|local]`];

    public static flags = {
        ...ReadCommand.baseFlags,
        unikid: flags.string({ description: "TODO", required: true }),
    };

    protected getCommand() {
        return ReadUnikCommand;
    }

    protected getCommandTechnicalName(): string {
        return "read-unik";
    }

    protected async do(flags: Record<string, any>) {
        const unik: any = await this.getUnikById(flags.unikid);
        const properties: any = await this.getProperties(flags.unikid);
        const creationTransaction = await this.getTransaction(unik.transactions.first.id);

        if (
            unik.chainmeta.height !== properties.chainmeta.height ||
            unik.chainmeta.height !== creationTransaction.chainmeta.height
        ) {
            throw new Error("Data consistency error. Please retry.");
        }

        /**
         * WALLET
         */
        this.log("UNIK:");
        this.logAttribute("unikid", unik.id);
        this.logAttribute("owner address", unik.ownerId);
        this.logAttribute("creation block", creationTransaction.blockId);
        this.logAttribute("creation transaction", creationTransaction.id);
        this.logAttribute("creation date", creationTransaction.timestamp.human);
        this.logAttribute("properties", "");
        for (const { key, value } of properties.data) {
            this.logAttribute(`\t${key}`, `${value}`);
        }

        this.showContext(unik.chainmeta);
    }

    /**
     * Get Wallet by address.
     * @param unikid
     */
    private getUnikById(unikid: string) {
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
    private getProperties(unikid: string) {
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
}
