import { flags } from "@oclif/command";
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

    protected getCommand() {
        return ReadWalletCommand;
    }

    protected getCommandTechnicalName(): string {
        return "read-wallet";
    }

    protected async do(flags: Record<string, any>) {
        const wallet: any = await this.api.getWallet(flags.idwallet);

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
        this.logAttribute("numberOfUNIK", wallet.tokens.length);

        this.showContext(wallet.chainmeta);

        if (flags.listunik) {
            /**
             * LIST OF UNIK
             */
            this.log(`\nLIST OF UNIK:${wallet.tokens.length === 0 ? " none" : ""}`);
            if (wallet.tokens.length > 0) {
                wallet.tokens.forEach(tokenID => {
                    this.logAttribute("unikid", tokenID);
                });
            }
        }
    }
}
