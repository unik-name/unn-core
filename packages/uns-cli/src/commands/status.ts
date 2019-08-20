import { color } from "@oclif/color";
import * as req from "request-promise";
import { BaseCommand } from "../baseCommand";

export class StatusCommand extends BaseCommand {
    public static description = "Display blockchain status";

    public static examples = [`$ uns status`];

    public static flags = {
        ...BaseCommand.baseFlags,
    };

    protected getCommand(): any {
        return StatusCommand;
    }

    protected async do(flags: Record<string, any>) {
        const unsSupply: any = await this.getSupply();

        const uniks: any = await this.getUniks();

        const lastBlockId = await this.getLastBlockId();
        const blockUrl = color.cyanBright(`${this.network.explorer}/block/${lastBlockId}`);

        this.log("Height: ", this.netWorkConfiguration.constants.height);
        this.log("Network: ", flags.network);
        this.log(`Supply ${this.netWorkConfiguration.token}: `, `${unsSupply} ${this.netWorkConfiguration.token}`);
        this.log(`Supply UNIKs: `, `${uniks} UNIKs`);
        this.log("Active delegates: ", this.netWorkConfiguration.constants.activeDelegates);
        this.log("Last block: ", blockUrl);
    }

    /**
     * Get total (D)UNS supply.
     */
    private async getSupply() {
        return req
            .get(`${this.network.url}/api/blocks/getSupply`)
            .then(resp => {
                return JSON.parse(resp).supply;
            })
            .catch(e => {
                throw new Error(`[status] Error fetching supply. Caused by ${e}`);
            });
    }

    /**
     * Get count of UNIKs
     */
    private async getUniks() {
        return req
            .get(`${this.network.url}/api/v2/nfts`)
            .then(resp => {
                return JSON.parse(resp).meta.count;
            })
            .catch(e => {
                throw new Error(`[status] Error fetching UNIKs.. Caused by ${e}`);
            });
    }

    /**
     * Get last block ID
     */
    private async getLastBlockId() {
        return req
            .get(`${this.network.url}/api/v2/blocks`)
            .then(resp => {
                const blocks: any[] = JSON.parse(resp).data;
                if (blocks.length === 0) {
                    throw new Error("[status] No block found.");
                }
                return JSON.parse(resp).data[0].id;
            })
            .catch(e => {
                throw new Error(`[status] Error fetching blocks.. Caused by ${e}`);
            });
    }
}
