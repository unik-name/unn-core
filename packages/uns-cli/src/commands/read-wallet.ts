import { flags } from "@oclif/command";
import { BaseCommand } from "../baseCommand";
import { CommandOutput } from "../formater";
import { ReadCommand } from "../readCommand";
import { getNetworksListListForDescription } from "../utils";

export class ReadWalletCommand extends ReadCommand {
    public static description = "Read current data of a specified wallet, ic. balance";

    public static examples = [
        `$ uns read-wallet [--publicKey {publicKey} | --address {address}] --listunik --network ${getNetworksListListForDescription()}`,
    ];

    public static flags = {
        ...ReadCommand.baseFlags,
        idwallet: flags.string({
            description: "The ID of the wallet. Can be either the publicKey or the address of the wallet.",
            required: true,
        }),
        listunik: flags.boolean({ description: "List UNIK tokens owned by the wallet, if any." }),
    };

    protected getCommand(): typeof BaseCommand {
        return ReadWalletCommand;
    }

    protected getCommandTechnicalName(): string {
        return "read-wallet";
    }

    protected async do(flags: Record<string, any>): Promise<CommandOutput> {
        const wallet: any = await this.api.getWallet(flags.idwallet);
        const tokens: any = await this.api.getWalletTokens(flags.idwallet);

        this.checkDataConsistency(wallet.chainmeta.height, tokens.chainmeta.height);

        /**
         * WALLET
         */
        this.log("UNS WALLET:");
        this.logAttribute("address", wallet.address);
        this.logAttribute("publicKey", wallet.publicKey);
        this.logAttribute("username", wallet.username);
        this.logAttribute("secondPublicKey", wallet.secondPublicKey);
        this.logAttribute("balance", `${this.fromSatoshi(wallet.balance)} ${this.api.getToken()}`);
        this.logAttribute("isDelegate", wallet.isDelegate);
        this.logAttribute("vote", wallet.vote);
        this.logAttribute("numberOfUNIK", tokens.data.length);

        this.showContext(wallet.chainmeta);

        if (flags.listunik) {
            /**
             * LIST OF UNIK
             */
            this.log(`\nLIST OF UNIK:${tokens.data.length === 0 ? " none" : ""}`);
            if (tokens.data.length > 0) {
                tokens.data.forEach(tokenProps => {
                    this.logAttribute("unikid", tokenProps.id);
                });
            }
        }
        return {};
    }
}
