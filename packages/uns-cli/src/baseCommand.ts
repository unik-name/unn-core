import { Command, flags } from "@oclif/command";
import { Client, configManager } from "@uns/crypto";
import * as req from "request-promise";
import { NETWORKS } from "./config";

export abstract class BaseCommand extends Command {
    public static baseFlags = {
        help: flags.help({ char: "h" }),
        network: flags.string({
            description: "Network used to create UNIK nft token (local are for development only)",
            required: true,
            options: ["devnet", "local"],
        }),
    };

    protected network: any;
    protected client: Client;
    protected netWorkConfiguration: any;

    public async run() {
        const { flags } = this.parse(this.getCommand());
        /**
         * Configuration
         */
        const networkName: string = flags.network ? flags.network.toLowerCase() : "mainnet";

        this.network = {
            ...NETWORKS[networkName],
            name: networkName,
        };

        this.client = new Client(configManager.getPreset(this.network.preset || this.network.name));
        this.netWorkConfiguration = await this.getRemoteNetworkConfiguration(this.network.url);
        this.network.explorer = this.netWorkConfiguration.explorer;

        if (this.netWorkConfiguration.errorMsg) {
            this.promptErrAndExit(this.netWorkConfiguration.errorMsg);
        }

        try {
            await this.do(flags);
        } catch (globalCatchException) {
            this.promptErrAndExit(globalCatchException.message);
        }
    }

    protected abstract do(flags: Record<string, any>): Promise<any>;
    protected abstract getCommand(): any;

    /**
     *
     * @param errorMsg Prompt error and exit command.
     */
    private promptErrAndExit(errorMsg: string): void {
        this.error(errorMsg);
        this.exit(1);
    }

    private getRemoteNetworkConfiguration(networkUrl: string) {
        return req
            .get(`${networkUrl}/api/v2/node/configuration`)
            .then(configResponse => {
                return JSON.parse(configResponse).data;
            })
            .catch(e => {
                return { errorMsg: `[create-unik] Error fetching network configuration. Caused by ${e.message}` };
            });
    }
}
