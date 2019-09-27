import { flags } from "@oclif/parser";
import { BaseCommand } from "../baseCommand";
import { Formater, OUTPUT_FORMAT } from "../formater";
import { UpdateProperties as UpdatePropertiesCommand } from "../updatePropertiesCommand";
import { getNetworksListListForDescription } from "../utils";

const KEY_VALUE_SEPARATOR = ":";

export class SetPropertiesCommand extends UpdatePropertiesCommand {
    public static description = "Set (add or update) properties of UNIK token.";

    public static examples = [
        `$ uns set-properties --network ${getNetworksListListForDescription()} --unkid {unikId}
        --properties "{key}:{value}" --format {json|yaml} --verbose`,
    ];

    public static flags = {
        ...UpdatePropertiesCommand.flags,
        properties: flags.string({
            description: `Array of properties to set: "key1:value1"
                "key3:" Sets "value1" to "key1" and empty string to "key3"`,
            required: true,
            multiple: true,
        }),
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml];
    }

    protected getCommand(): typeof BaseCommand {
        return SetPropertiesCommand;
    }

    protected getCommandTechnicalName(): string {
        return "set-properties";
    }

    protected getProperties(flags: Record<string, any>): { [_: string]: string } {
        const properties: { [_: string]: string } = {};
        for (const prop of flags.properties) {
            const keyValue = prop.split(KEY_VALUE_SEPARATOR);
            if (keyValue.length !== 2) {
                throw new Error(`Property parsing error. Should match key:value ${prop}`);
            }
            const [key, value] = keyValue;
            const keyMatcher = key.match(/[a-zA-Z_0-9]+/);
            if (!keyMatcher || keyMatcher[0] !== key) {
                throw new Error(`Property key ${key} should match [a-zA-Z_0-9]+ pattern`);
            }
            properties[key] = value;
        }
        return properties;
    }
}
