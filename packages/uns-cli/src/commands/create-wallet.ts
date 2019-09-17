import { color } from "@oclif/color";
import Command from "@oclif/command";
import { crypto } from "@uns/crypto";
import { generateMnemonic } from "bip39";
import { createHash, randomBytes } from "crypto";
import * as MoreEntropy from "promised-entropy";
import { BaseCommand } from "../baseCommand";
import { CommandOutput, Formater, OUTPUT_FORMAT } from "../formater";
import { getNetworksListListForDescription } from "../utils";

export class CreateWalletCommand extends BaseCommand {
    public static description = "Create UNS wallet";

    public static examples = [
        `$ uns create-wallet --network ${getNetworksListListForDescription()} --format {json|yaml}`,
    ];

    public static flags = {
        ...BaseCommand.baseFlags,
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml];
    }

    protected getCommand(): typeof BaseCommand {
        return CreateWalletCommand;
    }

    protected getCommandTechnicalName(): string {
        return "create-wallet";
    }

    protected async do(flags: Record<string, any>): Promise<CommandOutput> {
        const passphrase = await this.randomMnemonicSeed(128);
        const keys = crypto.getKeys(passphrase);
        const address = crypto.getAddress(keys.publicKey, this.api.network.version);
        const wallet = {
            address,
            publicKey: keys.publicKey,
            privateKey: keys.privateKey,
            passphrase,
            network: this.api.network.name,
        };

        // Do not use this.error. It throws error and close. {exit: 0} option closes too.
        console.error(
            color.red(
                "\n⚠️  WARNING: this information is not saved anywhere. You need to copy and save it by your own. ⚠️\n",
            ),
        );

        return wallet;
    }

    private async randomMnemonicSeed(nbBits: number) {
        const bytes = Math.ceil(nbBits / 8);
        const hudgeEntropy: number[] = await MoreEntropy.promisedEntropy(nbBits);
        const seed = randomBytes(bytes);
        const entropy = createHash("sha256")
            .update(Buffer.from(new Int32Array(hudgeEntropy).buffer))
            .update(seed)
            .digest()
            .slice(0, bytes);
        return generateMnemonic(nbBits, rgn => entropy);
    }
}
