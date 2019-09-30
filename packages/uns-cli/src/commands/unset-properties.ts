import { flags } from "@oclif/parser";
import { BaseCommand } from "../baseCommand";
import { Formater, OUTPUT_FORMAT } from "../formater";
import { UpdateProperties } from "../updatePropertiesCommand";
import { getNetworksListListForDescription } from "../utils";

export class UnsetProperties extends UpdateProperties {
    public static description = "Unset properties of UNIK token.";

    public static examples = [
        `$ uns unset-properties --network ${getNetworksListListForDescription()} --unkid {unikId}
        -k prop1 -k prop2 --format {json|yaml} --verbose`,
    ];

    public static flags = {
        ...UpdateProperties.flags,
        propertyKey: flags.string({
            char: "k",
            description: "Key of the property to unset. (multiple occurrences)",
            required: true,
            multiple: true,
        }),
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml];
    }

    protected getCommand(): typeof BaseCommand {
        return UnsetProperties;
    }

    protected getCommandTechnicalName(): string {
        return "set-properties";
    }

    protected getProperties(flags: Record<string, any>): { [_: string]: string } {
        const properties: { [_: string]: string } = {};

        flags.propertyKey.forEach(prop => {
            properties[prop] = null;
        });
        return properties;
    }
}
