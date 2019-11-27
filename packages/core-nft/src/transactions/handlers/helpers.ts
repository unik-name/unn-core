import { app } from "@arkecosystem/core-container";
import { State } from "@arkecosystem/core-interfaces";
import { Identities, Interfaces } from "@arkecosystem/crypto";
import { getCurrentNftAsset } from "@uns/core-nft-crypto";
import { INftWalletAttributes } from "../../interfaces";
import { NftsManager } from "../../manager";

export const applyNftMintDb = async (senderPublicKey: string, assets: Interfaces.ITransactionAsset): Promise<void> => {
    const { tokenId, properties } = getCurrentNftAsset(assets);
    const senderAddr = Identities.Address.fromPublicKey(senderPublicKey);
    const nftManager = app.resolvePlugin<NftsManager>("core-nft");
    await nftManager.insert(tokenId, senderAddr);

    if (properties) {
        return nftManager.insertProperties(properties, tokenId);
    }
};

export const removeNftFromWallet = async (
    walletId: string,
    assets: Interfaces.ITransactionAsset,
    walletManager: State.IWalletManager,
) => {
    const { tokenId } = getCurrentNftAsset(assets);
    const wallet: State.IWallet = walletManager.findById(walletId);

    const walletTokens: INftWalletAttributes = wallet.getAttribute<INftWalletAttributes>("tokens");
    walletTokens.tokens = walletTokens.tokens.filter(t => t !== tokenId);
    walletTokens.tokens.length > 1 ? wallet.setAttribute("tokens", walletTokens) : wallet.forgetAttribute("tokens");

    walletManager.reindex(wallet);
};

export const addNftToWallet = async (
    walletId: string,
    assets: Interfaces.ITransactionAsset,
    walletManager: State.IWalletManager,
) => {
    const { tokenId } = getCurrentNftAsset(assets);
    const wallet: State.IWallet = walletManager.findById(walletId);

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
