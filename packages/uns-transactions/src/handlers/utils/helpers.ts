import { app } from "@arkecosystem/core-container";
import { Database, NFT, State } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Interfaces } from "@arkecosystem/crypto";
import { NftsManager } from "@uns/core-nft";
import { nftRepository } from "@uns/core-nft/";
import { ICertificationable, ICertifiedDemand } from "@uns/crypto";

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
        // concat current & new values and remove duplicates with Set
        newValues = [...new Set(newValues.concat(currents))];
    }
    return newValues;
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
 * Check and find the issuer public key in the current Blockchain.
 *
 * @returns Success `[true, publicKey]` or Failure `[false, errorMessage]`
 *
 */
export const checkAndfindPublicKeyIssuer = async <T extends ICertificationable>(
    certification: ICertifiedDemand<T>,
    walletManager: State.IWalletManager,
    nftsRepository: NFT.INftsRepository,
): Promise<[boolean, string]> => {
    // check existence of certification issuer UNIK
    const issuer = await nftsRepository.findById(certification.payload.iss);
    if (!issuer) {
        return [false, `issuer UNIK not found for UNIK ID: ${certification.payload.iss}`];
    }
    const foundPublicKey = walletManager.findByAddress(issuer.ownerId)?.publicKey;

    if (!foundPublicKey) {
        return [false, `issuer publicKey not found for UNIK ID: ${certification.payload.iss}]`];
    }
    return [true, foundPublicKey];
};
