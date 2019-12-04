import { app } from "@arkecosystem/core-container";
import { Interfaces } from "@arkecosystem/crypto";

export const setExplicitValue = async (transaction: Interfaces.ITransaction): Promise<any> => {
    const tokenId = transaction.data.asset["disclose-demand"].payload.sub;
    const explicitValues = transaction.data.asset["disclose-demand"].payload.explicitValue;

    const nftManager = app.resolvePlugin("core-nft");
    const currentValues = await nftManager.getProperty(tokenId, "explicitValues");

    if (currentValues?.value) {
        const currentValuesArray = currentValues.value.split(",");
        // concat current & new values and remove duplicates with Set
        const newValues = [...new Set(explicitValues.concat(currentValuesArray))];
        return nftManager.updateProperty("explicitValues", newValues.join(","), tokenId);
    } else {
        if (explicitValues.length) {
            return await nftManager.insertProperty("explicitValues", explicitValues.join(","), tokenId);
        }
    }
};
