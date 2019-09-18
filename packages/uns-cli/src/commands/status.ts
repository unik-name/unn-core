import { BaseCommand } from "../baseCommand";
import { CommandOutput, Formater, OUTPUT_FORMAT } from "../formater";
import { getNetworksListListForDescription } from "../utils";

export class StatusCommand extends BaseCommand {
    public static description = "Display blockchain status";

    public static examples = [`$ uns status --network ${getNetworksListListForDescription()}`];

    public static flags = {
        ...BaseCommand.baseFlags,
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml, OUTPUT_FORMAT.table];
    }

    protected getCommand(): typeof BaseCommand {
        return StatusCommand;
    }

    protected getCommandTechnicalName(): string {
        return "status";
    }

    protected async do(flags: Record<string, any>): Promise<CommandOutput> {
        const unsSupply: any = await this.api.getSupply();

        const uniks: any = await this.api.getUniks();

        const currentHeight = await this.api.getCurrentHeight();
        const blockUrl = `${this.api.getExplorerUrl()}/block/${currentHeight}`;

        const result = {
            Height: currentHeight,
            Network: flags.network,
        };
        result[`Supply ${this.api.getToken()}`] = `${this.fromSatoshi(unsSupply)} ${this.api.getToken()}`;
        result["Supply UNIKs"] = `${uniks} UNIKs`;
        result["Active delegates"] = this.api.getActiveDelegates();
        result["Last block"] = blockUrl;

        return result;
    }
}
