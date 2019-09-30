import { BaseCommand } from "./baseCommand";
import { feeFlag } from "./utils";

export abstract class WriteCommand extends BaseCommand {
    public static flags = {
        ...BaseCommand.baseFlags,
        ...feeFlag(),
    };
}
