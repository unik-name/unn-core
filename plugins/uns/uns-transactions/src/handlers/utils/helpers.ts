import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Interfaces, Managers } from "@arkecosystem/crypto";
import { nftRepository, NftsManager } from "@uns/core-nft";
import { DIDTypes } from "@uns/crypto";

export const EXPLICIT_PROP_KEY = "explicitValues";

export const getCurrentTokenId = (transaction: Interfaces.ITransactionData): string => {
    return transaction.asset["disclose-demand"].payload.sub;
};

export const getNftsManager = (): NftsManager => {
    return app.resolvePlugin<NftsManager>("core-nft");
};

export const getWalletManager = (): IWalletManager => {
    return app.resolvePlugin<Database.IDatabaseService>("database").walletManager;
};

export const setExplicitValue = async (transaction: Interfaces.ITransaction): Promise<any> => {
    const tokenId = getCurrentTokenId(transaction.data);
    let explicitValues = transaction.data.asset["disclose-demand"].payload.explicitValue;

    const currentValues = await getNftsManager().getProperty(tokenId, EXPLICIT_PROP_KEY);
    explicitValues = manageNewExplicitValues(currentValues?.value.split(","), explicitValues);
    await getNftsManager().manageProperties({ [EXPLICIT_PROP_KEY]: explicitValues.join(",") }, tokenId);
};

const manageNewExplicitValues = (currents: string[], newValues: string[]): string[] => {
    if (currents?.length) {
        newValues = newValues.concat(currents);
    }
    // remove duplicates
    return [...new Set(newValues)];
};

export const revertExplicitValue = async (transaction: Interfaces.ITransactionData): Promise<void> => {
    const tokenId = getCurrentTokenId(transaction);

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
    await getNftsManager().manageProperties({ [EXPLICIT_PROP_KEY]: retrievedExplicits.join(",") }, tokenId);
};

/**
 * Check and find the unikid owner public key in the current Blockchain.
 *
 * @returns publicKey
 *
 */
export const checkAndGetPublicKey = async (unikId: string, walletManager: State.IWalletManager): Promise<string> => {
    // check existence of UNIK
    const unik = await nftRepository().findById(unikId);
    if (!unik) {
        throw new Error(`UNIK Id \"${unikId}\" not found.`);
    }
    const foundPublicKey = walletManager.findByAddress(unik.ownerId)?.publicKey;
    if (!foundPublicKey) {
        throw new Error(`publicKey not found for UNIK ID: ${unikId}`);
    }
    return foundPublicKey;
};

export const getDidTypeFromProperties = (properties: Array<{ key: string; value: string }>): DIDTypes =>
    parseInt(properties.find(entry => entry.key === "type").value);

export const getFoundationWallet = (walletManager: State.IWalletManager): State.IWallet => {
    const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
    return walletManager.findByAddress(Identities.Address.fromPublicKey(foundationPublicKey));
};
