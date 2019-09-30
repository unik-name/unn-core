import { BaseCommand } from "./baseCommand";
import { ChainMeta } from "./types";
import { chainmetaFlag } from "./utils";

export abstract class ReadCommand extends BaseCommand {
    public static flags = {
        ...BaseCommand.baseFlags,
        ...chainmetaFlag,
    };

    protected showContext(chainmeta: ChainMeta) {
        /**
         * CONTEXT
         */
        return {
            chainmeta: {
                network: this.api.network.name,
                node: this.api.getCurrentNode(),
                date: chainmeta.timestamp.human,
                height: chainmeta.height,
            },
        };
    }
}
