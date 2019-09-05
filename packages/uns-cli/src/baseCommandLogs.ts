import { BaseCommand } from "./baseCommand";

/**
 * Temporary abstract class to override log function only for some commands. A command that use verbose flag should extend BaseCommandLog
 * After migration of all commands to verbose mode (loggers), we should remove this class and override log function in BaseCommand. All commands will extend BaseCommand
 */
export abstract class BaseCommandLogs extends BaseCommand {
    /**
     * Enables this.log on every BaseCommandLogs sub commands
     */
    public log(message?: string, ...args: any[]): void {
        if (this.verbose) {
            if (args && args.length > 0) {
                super.log(message, args);
            } else {
                super.log(message);
            }
        }
    }
}
