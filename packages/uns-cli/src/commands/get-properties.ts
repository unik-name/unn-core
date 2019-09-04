import { flags } from "@oclif/command";
import { BaseCommand } from "../baseCommand";
import { getNetworksListListForDescription } from "../utils";

export class GetPropertiesCommand extends BaseCommand {
    public static description = "Get properties of UNIK token.";

    public static examples = [
        `$ uns get-properties --unikid {unikId} [--confirmed {number of confirmations}] --network ${getNetworksListListForDescription()}`,
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

    protected getCommand() {
        return GetPropertiesCommand;
    }

    protected getCommandTechnicalName(): string {
        return "get-properties";
    }

    protected async do(flags: Record<string, any>) {
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
    }
}
