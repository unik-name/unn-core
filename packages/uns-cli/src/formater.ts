import { flags } from "@oclif/command";
import Papa from "papaparse";
import YAML from "yaml";

import { EOL } from "os";

export interface CommandOutput {
    [_: string]: string | number;
}

export interface NestedCommandOutput {
    [_: string]: any;
}

export interface Formater {
    key: string;
    action: (obj: CommandOutput | CommandOutput[]) => string;
}

const json: Formater = {
    key: "json",
    action: (obj: NestedCommandOutput) => {
        return JSON.stringify(obj, null, 2);
    },
};

const raw: Formater = {
    key: "raw",
    action: (obj: CommandOutput) => {
        return Object.values(obj).join("\n");
    },
};

const table: Formater = {
    key: "table",
    action: (obj: CommandOutput[]) => {
        return Papa.unparse(obj, { newline: EOL, delimiter: ";" });
    },
};

const yaml: Formater = {
    key: "yaml",
    action: (obj: NestedCommandOutput) => {
        return YAML.stringify(obj).trim();
    },
};

export const OUTPUT_FORMAT = { json, raw, table, yaml };

export const getFormatsList = () => {
    return Object.keys(OUTPUT_FORMAT);
};

export const getFormatFlag = (defaultFormat, options) => {
    if (options.length > 0) {
        const keys = options.map(opt => opt.key);
        const flag: Partial<flags.IOptionFlag<string>> = {
            char: "f",
            options: keys,
            description: `Specify how to format the output [${keys.join("|")}].`,
        };
        if (defaultFormat) {
            Object.assign(flag, { default: defaultFormat.key });
        }
        return {
            format: flags.string(flag),
        };
    }
    return null;
};
