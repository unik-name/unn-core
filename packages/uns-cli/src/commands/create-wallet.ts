import { color } from "@oclif/color";
import { crypto } from "@uns/crypto";
import { generateMnemonic } from "bip39";
import { writeFileSync } from "fs";
import { BaseCommand } from "../baseCommand";

export class CreateWalletCommand extends BaseCommand {
    public static description = "Create UNS wallet";

    public static examples = [`$ uns create-wallet --network [devnet|local]`];

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
        const passphrase = generateMnemonic();
        const keys = crypto.getKeys(passphrase);
        const address = crypto.getAddress(keys.publicKey, this.network.version);
        const wallet = {
            address,
            publicKey: keys.publicKey,
            privateKey: keys.privateKey,
            passphrase,
            network: this.network.name,
        };

        const jsonWallet = JSON.stringify(wallet, null, 2);

        console.error(
            color.red(
                "\n⚠️  WARNING: this information is not saved anywhere. You need to copy and save it by your own. ⚠️\n",
            ),
        );

        console.log(jsonWallet);
    }
}
