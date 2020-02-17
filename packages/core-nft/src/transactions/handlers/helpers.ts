import { app } from "@arkecosystem/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Identities, Interfaces } from "@arkecosystem/crypto";
import { Enums, getCurrentNftAsset, getNftName, Interfaces as NftInterfaces } from "@uns/core-nft-crypto";
import { NftPropertyTooLongError } from "../../errors";
import { INftWalletAttributes } from "../../interfaces";
import { nftRepository, NftsManager } from "../../manager";

export const applyNftMintDb = async (senderPublicKey: string, assets: Interfaces.ITransactionAsset): Promise<void> => {
    const { tokenId, properties } = getCurrentNftAsset(assets);
    const senderAddr = Identities.Address.fromPublicKey(senderPublicKey);
    const nftManager = app.resolvePlugin<NftsManager>("core-nft");
    await nftManager.insert(tokenId, senderAddr);

    if (properties) {
        await nftManager.insertProperties(properties, tokenId);
    }
};

export const removeNftFromWallet = async (
    wallet: State.IWallet,
    assets: Interfaces.ITransactionAsset,
    walletManager: State.IWalletManager,
) => {
    const { tokenId } = getCurrentNftAsset(assets);

    const walletTokens: INftWalletAttributes = wallet.getAttribute<INftWalletAttributes>("tokens");
    walletTokens.tokens = walletTokens.tokens.filter(t => t !== tokenId);
    walletTokens.tokens.length > 0 ? wallet.setAttribute("tokens", walletTokens) : wallet.forgetAttribute("tokens");

    walletManager.reindex(wallet);
};

export const addNftToWallet = async (
    wallet: State.IWallet,
    assets: Interfaces.ITransactionAsset,
    walletManager: State.IWalletManager,
) => {
    const { tokenId } = getCurrentNftAsset(assets);

    const walletTokens: INftWalletAttributes = wallet.hasAttribute("tokens")
        ? wallet.getAttribute<INftWalletAttributes>("tokens")
        : { tokens: [] };
    walletTokens.tokens = walletTokens.tokens.concat(tokenId);
    wallet.setAttribute("tokens", walletTokens);

    walletManager.reindex(wallet);
};

export const applyNftTransferDb = async (
    recipientAddress: string,
    assets: Interfaces.ITransactionAsset,
): Promise<void> => {
    return app.resolvePlugin<NftsManager>("core-nft").updateOwner(getCurrentNftAsset(assets).tokenId, recipientAddress);
};

export const checkAssetPropertiesSize = (properties: NftInterfaces.INftProperties) => {
    for (const [key, value] of Object.entries(properties || {})) {
        if (value && Buffer.from(value, "utf8").length > 255) {
            throw new NftPropertyTooLongError(key);
        }
    }
};

export const revertProperties = async (transaction: Interfaces.ITransactionData): Promise<void> => {
    const { tokenId, properties } = getCurrentNftAsset(transaction.asset);
    const nftName: string = getNftName(transaction.asset);

    const asset = { nft: { [nftName]: { tokenId } } };
    const transactions = await nftRepository().findTransactionsByAsset(
        asset,
        [Enums.NftTransactionType.NftMint, transaction.type],
        transaction.typeGroup,
        "desc",
    );

    const retrievedProperties = {};
    let modifiedPropertyKeys = Object.keys(properties);
    // parse transactions from the last to first to get last value of modified keys
    for (const tx of transactions) {
        if (tx.id === transaction.id) {
            continue;
        }
        for (const key of modifiedPropertyKeys) {
            const txProperties = getCurrentNftAsset(tx.asset).properties;
            if (txProperties.hasOwnProperty(key)) {
                retrievedProperties[key] = txProperties[key];
                modifiedPropertyKeys = modifiedPropertyKeys.filter(elt => elt !== key);
            }
        }
        if (!modifiedPropertyKeys.length) {
            break;
        }
    }

    const manager = app.resolvePlugin<NftsManager>("core-nft");
    // delete the new created properties (no last known value)
    for (const key of modifiedPropertyKeys) {
        await manager.deleteProperty(key, tokenId);
    }
    // revert updated properties with last known value
    await manager.manageProperties(retrievedProperties, tokenId);
};
