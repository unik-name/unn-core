import { flags } from "@oclif/command";
import { BaseCommand } from "../baseCommand";
import { CommandOutput } from "../formater";
import { ReadCommand } from "../readCommand";
import { getNetworksListListForDescription } from "../utils";

export class ReadUnikCommand extends ReadCommand {
    public static description = "Display UNIK token informations";

    public static examples = [`$ uns read-unik --unikid {unikId} --network ${getNetworksListListForDescription()}`];

    public static flags = {
        ...ReadCommand.baseFlags,
        unikid: flags.string({ description: "Token id to read", required: true }),
    };

    protected getCommand(): typeof BaseCommand {
        return ReadUnikCommand;
    }

    protected getCommandTechnicalName(): string {
        return "read-unik";
    }

    protected async do(flags: Record<string, any>): Promise<CommandOutput> {
        const unik: any = await this.api.getUnikById(flags.unikid);
        const properties: any = await this.api.getUnikProperties(flags.unikid);
        const creationTransaction = await this.api.getTransaction(unik.transactions.first.id);

        this.checkDataConsistency(
            unik.chainmeta.height,
            properties.chainmeta.height,
            creationTransaction.chainmeta.height,
        );

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
        for (const prop of properties.data) {
            this.log("\t\t", prop);
        }

        this.showContext(unik.chainmeta);
        return {};
    }
}
