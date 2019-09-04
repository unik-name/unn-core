import { Command, flags } from "@oclif/command";
import { Client, configManager } from "@uns/crypto";
import { UNSCLIAPI } from "./api";
import * as UTILS from "./utils";

export abstract class BaseCommand extends Command {
    public static baseFlags = {
        help: flags.help({ char: "h" }),
        network: flags.string({
            description: "Network on which to run the command.",
            required: true,
            options: UTILS.getNetworksList(),
        }),
    };

    protected client: Client;
    protected api;

    public async run() {
        const { flags } = this.parse(this.getCommand());
        /**
         * Configuration
         */
        const networkName = flags.network === "local" ? "testnet" : flags.network;

        const networkPreset = configManager.getPreset(networkName);

        networkPreset.network.name = flags.network;

        this.api = new UNSCLIAPI(networkPreset);

        this.client = new Client(networkPreset);

        try {
            await this.do(flags);
        } catch (globalCatchException) {
            this.promptErrAndExit(globalCatchException.message);
        }
    }

    protected abstract do(flags: Record<string, any>): Promise<any>;
    protected abstract getCommand(): any;
    protected abstract getCommandTechnicalName(): string;

    protected logAttribute(label: string, value: string) {
        this.log(`\t${label}: ${value}`);
    }

    /**
     *
     * @param value Transform value to satoshi number
     */
    protected toSatoshi(value: number): string {
        return `${value * 100000000}`;
    }

    protected fromSatoshi(value: number): string {
        return `${value / 100000000}`;
    }

    /**
     * Checks that all heights passed in parameter are equals
     * @param heights
     */
    protected checkDataConsistency(...heights: number[]) {
        if (!heights.every(v => v === heights[0])) {
            throw new Error("Data consistency error. Please retry.");
        }
    }

    /**
     *
     * @param errorMsg Prompt error and exit command.
     */
    private promptErrAndExit(errorMsg: string): void {
        this.error(`[${this.getCommandTechnicalName()}] ${errorMsg}`);
        this.exit(1);
    }
}
