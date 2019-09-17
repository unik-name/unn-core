import { BaseCommand } from "./baseCommand";

/**
 * Temporary abstract class to override log function only for some commands. A command that use verbose flag should extend BaseCommandLog
 * After migration of all commands to verbose mode (loggers), we should remove this class and override log function in BaseCommand. All commands will extend BaseCommand
 */
export abstract class BaseCommandLogs extends BaseCommand {
    /**
     * Enables this.log on every BaseCommandLogs sub commands
     */
    public log(message = "", ...args: any[]): void {
        // If help flag is set, we force logger. We can only test here.
        if (this.verbose || this._helpOverride()) {
            if (args && args.length > 0) {
                super.log(message, args);
            } else {
                super.log(message);
            }
        }
    }

    /**
     * Override of _helpOverride to take care of all help flags
     */
    public _helpOverride() {
        for (const arg of this.argv) {
            if (arg === "--help" || arg === "-h" || arg === "help") {
                return true;
            }
            if (arg === "--") {
                return false;
            }
        }
        return false;
    }
}
