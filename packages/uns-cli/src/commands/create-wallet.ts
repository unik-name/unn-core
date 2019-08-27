import { color } from "@oclif/color";
import { crypto } from "@uns/crypto";
import { generateMnemonic } from "bip39";
import { createHash, randomBytes } from "crypto";
import * as MoreEntropy from "promised-entropy";
import { BaseCommand } from "../baseCommand";
import { getNetworksListListForDescription } from "../utils";

export class CreateWalletCommand extends BaseCommand {
    public static description = "Create UNS wallet";

    public static examples = [`$ uns create-wallet --network ${getNetworksListListForDescription()}`];

    public static flags = {
        ...BaseCommand.baseFlags,
    };

    protected getCommand() {
        return CreateWalletCommand;
    }

    protected getCommandTechnicalName(): string {
        return "create-wallet";
    }

    protected async do(flags: Record<string, any>) {
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

        const jsonWallet = JSON.stringify(wallet, null, 2);

        // Do not use this.error. It throws error and close. {exit: 0} option closes too.
        console.error(
            color.red(
                "\n⚠️  WARNING: this information is not saved anywhere. You need to copy and save it by your own. ⚠️\n",
            ),
        );

        this.log(jsonWallet);
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
