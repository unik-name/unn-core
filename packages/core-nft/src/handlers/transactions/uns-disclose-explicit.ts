import { app } from "@arkecosystem/core-container";
import { Logger } from "@arkecosystem/core-interfaces";
import { ITransactionData } from "@arkecosystem/crypto";
import { NFTModifier } from "../../modifier";

const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

export abstract class UNSDiscloseExpliciteHandler {
    public static async onApplied(transaction: ITransactionData) {
        const tokenId = transaction.asset["disclose-demand"].payload.sub;
        const explicitValues = transaction.asset["disclose-demand"].payload.explicitValue;

        const currentValues = await NFTModifier.getProperty(tokenId, "explicitValues");
        if (currentValues && currentValues.value) {
            const currentValuesArray = currentValues.value.split(",");
            const newValues = explicitValues.filter(explicitVal => {
                return !currentValuesArray.includes(explicitVal);
            });
            if (newValues.length) {
                return NFTModifier.updateProperty(
                    "explicitValues",
                    currentValues.value + "," + newValues.join(","),
                    tokenId,
                );
            }
        } else {
            if (explicitValues.length) {
                return NFTModifier.insertProperty("explicitValues", explicitValues.join(","), tokenId);
            }
        }
    }

    public static async onReverted(transaction: ITransactionData) {
        /*
            TODO:
        */
    }
}
