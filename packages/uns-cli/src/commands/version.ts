import { Command } from "@oclif/command";

/**
 * Empty version command, just used to display version command in CLI help commands list
 */
export class VersionCommand extends Command {
    public static description = "UNS CLI Version";

    public async run() {
        // Nothing to do
    }
}
