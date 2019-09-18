import { flags } from "@oclif/parser";
import { BaseCommand } from "../baseCommand";
import { CommandOutput, Formater, OUTPUT_FORMAT } from "../formater";
import {
    checkPassphraseFormat,
    checkUnikIdFormat,
    createNFTUpdateTransaction,
    getNetworksListListForDescription,
    getPassphraseFromUser,
    passphraseFlag,
} from "../utils";

const KEY_VALUE_SEPARATOR = ":";

export class SetPropertiesCommand extends BaseCommand {
    public static description = "Set (add or update) properties of UNIK token.";

    public static examples = [
        `$ uns set-properties --network ${getNetworksListListForDescription()} --unkid {unikId}
        --properties "{key}:{value}" --format {json|yaml} --verbose`,
    ];

    public static flags = {
        ...BaseCommand.baseFlags,
        unikid: flags.string({
            description: "The UNIK token on which to set the properties.",
            required: true,
        }),
        properties: flags.string({
            description: `Array of properties to set: "key1:value1"
                "key3:" Sets "value1" to "key1" and empty string to "key3"`,
            required: true,
            multiple: true,
        }),
        await: flags.integer({
            description: `Number of blocks to wait to get confirmed for the success. Default to 3.
                0 for immediate return.
                Needs to be strictly greater than --confirmation flag`,
            default: 3,
        }),
        confirmations: flags.integer({
            description:
                "Number of confirmations to wait to get confirmed for the success. Default to 1.\n\t Needs to be strictly lower than --await flag",
            default: 1,
        }),
        ...passphraseFlag,
        fee: flags.integer({
            description: "Specify a dynamic fee in satoUNS. Defaults to 100000000 satoUNS = 1 UNS.",
            default: 100000000,
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

    protected async do(flags: Record<string, any>): Promise<CommandOutput> {
        // Check flags consistency
        if (flags.await <= flags.confirmations) {
            throw new Error(
                `Flags consistency error. --await (${flags.await}) should be strictly higher than --confirmations (${
                    flags.confirmations
                })`,
            );
        }

        // Check unikid format
        checkUnikIdFormat(flags.unikid);

        // Parse properties
        const properties: { [_: string]: string } = this.parseProperties(flags.properties);

        // Get passphrase
        let passphrase = flags.passphrase;
        if (!passphrase) {
            passphrase = await getPassphraseFromUser();
        }

        // Check passphrase format
        checkPassphraseFormat(passphrase);

        // Update transaction
        const transactionStruct = createNFTUpdateTransaction(
            this.client,
            flags.unikid,
            properties,
            flags.fee,
            this.api.getVersion(),
            passphrase,
        );

        this.log("Binding new propert" + (Object.keys(properties).length > 1 ? "ies" : "y") + " to UNIK.");
        const sendResult = await this.api.sendTransaction(transactionStruct);
        if (sendResult.errors) {
            throw new Error(`Transaction not accepted. Caused by: ${JSON.stringify(sendResult.errors)}`);
        }
        this.actionStart("Waiting for transaction confirmation");
        const finalTransaction = await this.waitTransactionConfirmations(
            this.api.getBlockTime(),
            transactionStruct.id,
            flags.await,
            flags.confirmations,
        );
        this.actionStop();

        return {
            id: flags.unikid,
            transaction: finalTransaction.id,
            confirmations: finalTransaction.confirmations,
        };
    }

    private parseProperties(props: string[]): { [_: string]: string } {
        const properties: { [_: string]: string } = {};
        for (const prop of props) {
            const firstSeparatorIndex = prop.indexOf(KEY_VALUE_SEPARATOR);
            if (firstSeparatorIndex === -1) {
                throw new Error(`Property ${prop}, doesn't contain ${KEY_VALUE_SEPARATOR}`);
            }
            properties[prop.substr(0, firstSeparatorIndex)] = prop.substr(firstSeparatorIndex + 1);
        }
        return properties;
    }
}
