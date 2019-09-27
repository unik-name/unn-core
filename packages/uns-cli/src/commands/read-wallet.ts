import { flags } from "@oclif/command";
import { BaseCommand } from "../baseCommand";
import { Formater, NestedCommandOutput, OUTPUT_FORMAT } from "../formater";
import { ReadCommand } from "../readCommand";
import { getNetworksListListForDescription } from "../utils";

export class ReadWalletCommand extends ReadCommand {
    public static description = "Read current data of a specified wallet, ic. balance";

    public static examples = [
        `$ uns read-wallet {publicKey|address} --listunik --network ${getNetworksListListForDescription()} --format {json|yaml}`,
    ];

    public static flags = {
        ...ReadCommand.flags,
        listunik: flags.boolean({ description: "List UNIK tokens owned by the wallet, if any." }),
    };

    public static args = [
        {
            name: "walletId",
            description: "The ID of the wallet. Can be either the publicKey or the address of the wallet.",
            required: true,
        },
    ];

    protected getAvailableFormats(): Formater[] {
        return [OUTPUT_FORMAT.json, OUTPUT_FORMAT.yaml];
    }

    protected getCommand(): typeof BaseCommand {
        return ReadWalletCommand;
    }

    protected getCommandTechnicalName(): string {
        return "read-wallet";
    }

    protected async do(flags: Record<string, any>, args?: Record<string, any>): Promise<NestedCommandOutput> {
        const walletId = args.walletId;
        const wallet: any = await this.api.getWallet(walletId);
        const tokens: any = await this.api.getWalletTokens(walletId);

        this.checkDataConsistency(wallet.chainmeta.height, tokens.chainmeta.height);

        const data: NestedCommandOutput = {
            address: wallet.address,
            publicKey: wallet.publicKey,
            username: wallet.username,
            secondPublicKey: wallet.secondPublicKey,
            balance: this.fromSatoshi(wallet.balance),
            token: this.api.getToken(),
            isDelegate: wallet.isDelegate,
            vote: wallet.vote,
            nfts: {
                unik: tokens.data.length,
            },
        };

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
            data.tokens = {
                unik: tokens.data.map(t => t.id),
            };
        }

        return {
            data,
            ...(flags.chainmeta ? this.showContext(wallet.chainmeta) : {}),
        };
    }
}
