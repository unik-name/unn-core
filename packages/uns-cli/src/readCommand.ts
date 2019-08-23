import { BaseCommand } from "./baseCommand";
import { ChainMeta } from "./types";

export abstract class ReadCommand extends BaseCommand {
    protected showContext(chainmeta: ChainMeta) {
        /**
         * CONTEXT
         */
        this.log("\nCONTEXT:");
        this.logAttribute("network", this.network.name);
        this.logAttribute("node", this.getCurrentNode());
        this.logAttribute("readDateTime", chainmeta.timestamp.human);
        this.logAttribute("height", chainmeta.height);
    }

    private getCurrentNode() {
        return this.network.url;
    }
}
