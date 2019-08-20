import { flags } from "@oclif/command";
import { crypto } from "@uns/crypto";
import * as req from "request-promise";
import { BaseCommand } from "../baseCommand";

export class ReadWalletCommand extends BaseCommand {
    public static description = "Display UNS wallet informations";

    public static examples = [
        `$ uns read-wallet [--publicKey {publicKey} | --address {address}] --listunik --network [devnet|local]`,
    ];

    public static flags = {
        ...BaseCommand.baseFlags,
        publicKey: flags.string({ description: "TODO", exclusive: ["address"] }),
        address: flags.string({ description: "TODO", exclusive: ["publicKey"] }),
        listunik: flags.boolean({ description: "TODO" }),
    };

    protected getCommand() {
        return ReadWalletCommand;
    }

    protected async do(flags: Record<string, any>) {
        // Flags exclusivity in controlled by "exclusive" flags attributes, but we can't control requirement on these two flags by design
        if (!flags.publicKey && !flags.address) {
            throw new Error(
                "[read-wallet] missing required flag. You must at least specify on of these parameters: ['--publicKey', '--address']",
            );
        }

        const address = flags.address || crypto.getAddress(flags.publicKey, this.network.version);

        const wallet: any = await this.getWalletByAddress(address);

        /**
         * WALLET
         */
        this.log("UNS WALLET:");
        this.logAttribute("address", address);
        this.logAttribute("publicKey", wallet.publicKey);
        this.logAttribute("username", wallet.username);
        this.logAttribute("secondPublicKey", wallet.secondPublicKey);
        this.logAttribute("balance", `${wallet.balance} ${this.netWorkConfiguration.token}`);
        this.logAttribute("isDelegate", wallet.isDelegate);
        this.logAttribute("vote", wallet.vote);
        this.logAttribute("numberOfUNIK", wallet.tokens.length);

        /**
         * CONTEXT
         */
        this.log("\nCONTEXT:");
        this.logAttribute("network", this.network.name);
        this.logAttribute("node", this.getCurrentNode());
        this.logAttribute("readDateTime", "TODO");
        this.logAttribute("height", "TODO");

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

    /**
     * Get Wallet by address.
     * @param address
     */
    private getWalletByAddress(address: string) {
        return req
            .get(`${this.network.url}/api/v2/wallets/${address}`)
            .then(res => {
                return JSON.parse(res).data;
            })
            .catch(e => {
                const error =
                    e.statusCode === 404
                        ? `[read-wallet] No wallet found with address ${address}.`
                        : `[read-wallet] Error fetching wallet ${address}. Caused by ${e.message}`;
                throw new Error(error);
            });
    }

    private getCurrentNode() {
        return this.network.url;
    }

    private logAttribute(label: string, value: string) {
        this.log(`\t${label}: ${value}`);
    }
}
