import { flags } from "@oclif/command";
import { BaseCommand } from "../baseCommand";
import { Formater, NestedCommandOutput, OUTPUT_FORMAT } from "../formater";
import { ReadCommand } from "../readCommand";
import { getNetworksListListForDescription, unikidFlag } from "../utils";

export class ReadUnikCommand extends ReadCommand {
    public static description = "Display UNIK token informations";

    public static examples = [
        `$ uns read-unik --unikid {unikId} --network ${getNetworksListListForDescription()} --format {json|yaml}`,
    ];

    public static flags = {
        ...ReadCommand.flags,
        ...unikidFlag("Token id to read"),
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml];
    }

    protected getCommand(): typeof BaseCommand {
        return ReadUnikCommand;
    }

    protected getCommandTechnicalName(): string {
        return "read-unik";
    }

    protected async do(flags: Record<string, any>): Promise<NestedCommandOutput> {
        const unik: any = await this.api.getUnikById(flags.unikid);
        const properties: any = await this.api.getUnikProperties(flags.unikid);
        const creationTransaction = await this.api.getTransaction(unik.transactions.first.id);

        this.checkDataConsistency(
            unik.chainmeta.height,
            properties.chainmeta.height,
            creationTransaction.chainmeta.height,
        );

        const data = {
            id: unik.id,
            ownerAddress: unik.ownerId,
            creationBlock: creationTransaction.blockId,
            creationTransaction: creationTransaction.id,
            creationDate: creationTransaction.timestamp.human,
            properties: properties.data,
        };

        return {
            data,
            ...(flags.chainmeta ? this.showContext(unik.chainmeta) : {}),
        };
    }
}
