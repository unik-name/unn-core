import { BaseCommand } from "./baseCommand";
import { ChainMeta } from "./types";

export abstract class ReadCommand extends BaseCommand {
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
