import { app } from "@arkecosystem/core-container";
import { Interfaces } from "@arkecosystem/crypto";

export const EXPLICIT_PROP_KEY = "explicitValues";

export const getExplicitValue = (transaction: Interfaces.ITransactionData): string => {
    return transaction.asset["disclose-demand"].payload.explicitValue.join(",");
};

export const setExplicitValue = async (transaction: Interfaces.ITransaction): Promise<any> => {
    const tokenId = transaction.data.asset["disclose-demand"].payload.sub;
    let explicitValues = transaction.data.asset["disclose-demand"].payload.explicitValue;

    const nftManager = app.resolvePlugin("core-nft");
    const currentValues = await nftManager.getProperty(tokenId, EXPLICIT_PROP_KEY);

    if (currentValues?.value) {
        const currentValuesArray = currentValues.value.split(",");
        // concat current & new values and remove duplicates with Set
        explicitValues = [...new Set(explicitValues.concat(currentValuesArray))];
    }
    nftManager.manageProperties({ [EXPLICIT_PROP_KEY]: explicitValues.join(",") }, tokenId);
};
