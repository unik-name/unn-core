import { flags } from "@oclif/command";
import { BaseCommand } from "../baseCommand";
import { CommandOutput, Formater, NestedCommandOutput, OUTPUT_FORMAT } from "../formater";
import { getNetworksListListForDescription } from "../utils";

export class GetPropertiesCommand extends BaseCommand {
    public static description = "Get properties of UNIK token.";

    public static examples = [
        `$ uns get-properties --unikid {unikId} [--confirmed {number of confirmations}]
        --network ${getNetworksListListForDescription()} --format {json|yaml|table|raw}`,
    ];

    public static flags = {
        ...BaseCommand.baseFlags,
        unikid: flags.string({
            description: "The UNIK token on which to get the properties.",
            required: true,
        }),
        confirmed: flags.integer({
            default: 3,
            description:
                "Minimum number of confirmation since the last update of the UNIK required to return the value.",
        }),
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml, OUTPUT_FORMAT.table, OUTPUT_FORMAT.raw];
    }

    protected getCommand(): typeof BaseCommand {
        return GetPropertiesCommand;
    }

    protected getCommandTechnicalName(): string {
        return "get-properties";
    }

    protected async do(flags: Record<string, any>): Promise<NestedCommandOutput | CommandOutput[]> {
        const unik = await this.api.getUnikById(flags.unikid);
        const lastTransaction = await this.api.getTransaction(unik.transactions.last.id);
        const properties: any = await this.api.getUnikProperties(flags.unikid);
        const lastUpdateHeight = lastTransaction.chainmeta.height;

        this.checkDataConsistency(unik.chainmeta.height, lastUpdateHeight, properties.chainmeta.height);

        if (lastTransaction.confirmations < flags.confirmed) {
            throw new Error(
                `Not enough confirmations (expected: ${flags.confirmed}, actual: ${lastTransaction.confirmations})`,
            );
        }

        this.log("UNIK:");
        this.logAttribute("unikid", unik.id);
        this.logAttribute("properties", "");
        for (const prop of properties.data) {
            this.log("\t\t", prop);
        }
        this.logAttribute("confirmations", lastTransaction.confirmations);

        if (flags.format === OUTPUT_FORMAT.raw.key) {
            return properties.data.reduce((accumulator, currentValue) => Object.assign(accumulator, currentValue));
        }

        if (flags.format === OUTPUT_FORMAT.table.key) {
            return properties.data.map(prop => {
                return {
                    unikid: unik.id,
                    key: Object.keys(prop)[0],
                    value: Object.values(prop)[0],
                    confirmations: lastTransaction.confirmations,
                };
            });
        }

        return {
            unikid: unik.id,
            properties: properties.data,
            confirmations: lastTransaction.confirmations,
        };
    }
}
