import { app } from "@arkecosystem/core-container";
import { Interfaces } from "@arkecosystem/crypto";
import { nftRepository } from "@uns/core-nft/";

export const EXPLICIT_PROP_KEY = "explicitValues";

export const getCurrentTokenId = (transaction: Interfaces.ITransactionData): string => {
    return transaction.asset["disclose-demand"].payload.sub;
};

export const setExplicitValue = async (transaction: Interfaces.ITransaction): Promise<any> => {
    const tokenId = getCurrentTokenId(transaction.data);
    let explicitValues = transaction.data.asset["disclose-demand"].payload.explicitValue;

    const nftManager = app.resolvePlugin("core-nft");
    const currentValues = await nftManager.getProperty(tokenId, EXPLICIT_PROP_KEY);
    explicitValues = manageNewExplicitValues(currentValues?.value.split(","), explicitValues);
    nftManager.manageProperties({ [EXPLICIT_PROP_KEY]: explicitValues.join(",") }, tokenId);
};

const manageNewExplicitValues = (currents: string[], newValues: string[]): string[] => {
    if (currents?.length) {
        // concat current & new values and remove duplicates with Set
        newValues = [...new Set(newValues.concat(currents))];
    }
    return newValues;
};

export const revertExplicitValue = async (transaction: Interfaces.ITransactionData): Promise<void> => {
    const tokenId = getCurrentTokenId(transaction);
    const manager = app.resolvePlugin("core-nft");

    const asset = { "disclose-demand": { payload: { sub: tokenId } } };
    const transactions = await nftRepository().findTransactionsByAsset(
        asset,
        [transaction.type],
        transaction.typeGroup,
    );
    let retrievedExplicits = [];

    for (const tx of transactions) {
        if (tx.id === transaction.id) {
            continue;
        }
        const txValues = tx.asset["disclose-demand"].payload.explicitValue;
        retrievedExplicits = manageNewExplicitValues(retrievedExplicits, txValues);
    }
    // revert updated properties with last known value
    await manager.manageProperties({ [EXPLICIT_PROP_KEY]: retrievedExplicits.join(",") }, tokenId);
};
