import { app } from "@arkecosystem/core-container";
import { Interfaces } from "@arkecosystem/crypto";

export const setExplicitValue = async (transaction: Interfaces.ITransaction): Promise<any> => {
    const tokenId = transaction.data.asset["disclose-demand"].payload.sub;
    let explicitValues = transaction.data.asset["disclose-demand"].payload.explicitValue;

    const nftManager = app.resolvePlugin("core-nft");
    const currentValues = await nftManager.getProperty(tokenId, "explicitValues");

    if (currentValues?.value) {
        const currentValuesArray = currentValues.value.split(",");
        // concat current & new values and remove duplicates with Set
        explicitValues = [...new Set(explicitValues.concat(currentValuesArray))];
    }

    return await nftManager.manageProperties({ explicitValues: explicitValues.join(",") }, tokenId);
};
