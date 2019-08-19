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
        if (unsSupply.errorMsg) {
            this.promptErrAndExit(unsSupply.errorMsg);
        }

        const uniks: any = await this.getUniks();
        if (uniks.errorMsg) {
            this.promptErrAndExit(uniks.errorMsg);
        }

        const lastBlockId = await this.getLastBlockId();
        if (lastBlockId.errorMsg) {
            this.promptErrAndExit(lastBlockId.errorMsg);
        }
        const blockUrl = color.cyanBright(`${this.network.explorer}/block/${lastBlockId}`);

        this.log("Height: ", this.netWorkConfiguration.constants.height);
        this.log("Network: ", flags.network);
        this.log(`Supply ${this.netWorkConfiguration.token}: `, `${unsSupply} ${this.netWorkConfiguration.token}`);
        this.log(`Supply UNIKs: `, `${uniks} UNIKs`);
        this.log("Active delegates: ", this.netWorkConfiguration.constants.activeDelegates);
        this.log("Last block: ", blockUrl);
    }

    protected getErrorObject(msg: string, exception?: any) {
        return { errorMsg: `[status] ${msg}. ${exception ? `Caused by ${exception.message}` : ""}` };
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
                return this.getErrorObject("Error fetching supply.", e);
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
                return this.getErrorObject("Error fetching UNIKs.", e);
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
                return blocks && blocks.length > 0
                    ? JSON.parse(resp).data[0].id
                    : this.getErrorObject("No block found.");
            })
            .catch(e => {
                return this.getErrorObject("Error fetching blocks.", e);
            });
    }
}
