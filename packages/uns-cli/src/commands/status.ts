import { color } from "@oclif/color";
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

    protected getCommandTechnicalName(): string {
        return "status";
    }

    protected async do(flags: Record<string, any>) {
        const unsSupply: any = await this.api.getSupply();

        const uniks: any = await this.api.getUniks();

        const currentHeight = await this.api.getCurrentHeight();
        const blockUrl = color.cyanBright(`${this.api.getExplorerUrl()}/block/${currentHeight}`);

        this.log("Height: ", currentHeight);
        this.log("Network: ", flags.network);
        this.log(`Supply ${this.api.getToken()}: `, `${this.fromSatoshi(unsSupply)} ${this.api.getToken()}`);
        this.log(`Supply UNIKs: `, `${uniks} UNIKs`);
        this.log("Active delegates: ", this.api.getActiveDelegates());
        this.log("Last block: ", blockUrl);
    }
}
