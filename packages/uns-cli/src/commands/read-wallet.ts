import { flags } from "@oclif/command";
import { BaseCommand } from "../baseCommand";
import { CommandOutput, Formater, OUTPUT_FORMAT } from "../formater";
import { ReadCommand } from "../readCommand";
import { getNetworksListListForDescription } from "../utils";

export class ReadWalletCommand extends ReadCommand {
    public static description = "Read current data of a specified wallet, ic. balance";

    public static examples = [
        `$ uns read-wallet --idwallet {publicKey|address} --listunik --network ${getNetworksListListForDescription()} --format {json|yaml}`,
    ];

    public static flags = {
        ...ReadCommand.baseFlags,
        idwallet: flags.string({
            description: "The ID of the wallet. Can be either the publicKey or the address of the wallet.",
            required: true,
        }),
        listunik: flags.boolean({ description: "List UNIK tokens owned by the wallet, if any." }),
    };

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml];
    }

    protected getDefaultFormat(): Formater {
        return OUTPUT_FORMAT.json;
    }

    protected getCommand(): typeof BaseCommand {
        return ReadWalletCommand;
    }

    protected getCommandTechnicalName(): string {
        return "read-wallet";
    }

    protected async do(flags: Record<string, any>): Promise<CommandOutput> {
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

        let result = {
            data: {
                address: wallet.address,
                publicKey: wallet.publicKey,
                username: wallet.username,
                secondPublicKey: wallet.secondPublicKey,
                tokenName: `${this.api.getToken()}`,
                balance: Number(`${this.fromSatoshi(wallet.balance)}`),
                isDelegate: wallet.isDelegate,
                vote: wallet.vote,
                nbUnik: wallet.tokens.length,
            },
        };
        if (flags.listunik) {
            result = {
                data: { ...result.data, ...{ tokens: wallet.tokens } },
            };
        }

        return { ...result, ...this.showContext(wallet.chainmeta) };
    }
}
