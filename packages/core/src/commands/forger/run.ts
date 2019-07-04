import { app } from "@arkecosystem/core-container";
import { CommandFlags } from "../../types";
import { BaseCommand } from "../command";

export class RunCommand extends BaseCommand {
    public static description: string = "Run the forger (without pm2)";

    public static examples: string[] = [
        `Run a forger with a bip39 passphrase
$ ark forger:run --bip39="..."
`,
        `Run a forger with an encrypted bip38
$ ark forger:run --bip38="..." --password="..."
`,
    ];

    public static flags: CommandFlags = {
        ...BaseCommand.flagsNetwork,
        ...BaseCommand.flagsForger,
    };

    public async run(): Promise<void> {
        const { flags } = await this.parseWithNetwork(RunCommand);

        await this.buildApplication(app, flags, {
            include: [
                "@uns/core-event-emitter",
                "@uns/core-config",
                "@uns/core-logger",
                "@uns/core-logger-pino",
                "@uns/core-forger",
            ],
            options: {
                "@uns/core-forger": await this.buildBIP38(flags),
            },
        });
    }
}
