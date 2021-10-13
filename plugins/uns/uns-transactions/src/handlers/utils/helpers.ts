import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import { nftRepository, NftsManager } from "@uns/core-nft";
import { getCurrentNftAsset, getNftName, getTokenId } from "@uns/core-nft-crypto";
import { DIDTypes } from "@uns/crypto";
import { VoucherAlreadyUsedError, WrongFeeError, WrongServiceCostError } from "../../errors";

export const EXPLICIT_PROP_KEY = "explicitValues";

export const getNftsManager = (): NftsManager => {
    return app.resolvePlugin<NftsManager>("core-nft");
};

export const getWalletManager = (): IWalletManager => {
    return app.resolvePlugin<Database.IDatabaseService>("database").walletManager;
};

export const setExplicitValue = async (transactionAsset: Interfaces.ITransactionAsset): Promise<any> => {
    const tokenId = getTokenId(transactionAsset);

    let explicitValues = transactionAsset["disclose-demand"].payload.explicitValue;

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
    const tokenId = getTokenId(transaction.asset);

    const asset = { "disclose-demand": { payload: { sub: tokenId } } };
    const transactions = await nftRepository().findTransactionsByAsset(
        asset,
        [transaction.type],
        [transaction.typeGroup],
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
 * Get Unik owner.
 *
 * @returns publicKey
 *
 */
export const getUnikOwnerAddress = async (tokenId: string): Promise<string> => {
    const unik = await nftRepository().findById(tokenId);
    return unik.ownerId;
};

export const getDidTypeFromProperties = (properties: Array<{ key: string; value: string }>): DIDTypes =>
    parseInt(properties.find(entry => entry.key === "type").value);

export const getFoundationWallet = (walletManager: State.IWalletManager): State.IWallet => {
    const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
    return walletManager.findByAddress(Identities.Address.fromPublicKey(foundationPublicKey));
};

export const throwIfAlreadyUsedVoucher = async (transaction: Interfaces.ITransaction): Promise<void> => {
    // Check voucher existence in DB
    const voucherId = getCurrentNftAsset(transaction.data.asset).properties.UnikVoucherId;
    const asset = {
        nft: { [getNftName(transaction.data.asset)]: { properties: { UnikVoucherId: voucherId } } },
    };
    const transactions = await nftRepository().findTransactionsByAsset(
        asset,
        [transaction.type],
        [transaction.typeGroup],
    );
    if (transactions?.length) {
        throw new VoucherAlreadyUsedError(voucherId);
    }
};

export const getDelegateType = (walletManager: State.IWalletManager, wallet: State.IWallet): DIDTypes | undefined => {
    if (!wallet.hasVoted()) {
        return undefined;
    }
    const delegate: State.IWallet = walletManager.findByPublicKey(wallet.getAttribute("vote"));
    return delegate.getAttribute<DIDTypes>("delegate.type");
};

export const throwIfInvalidAmount = (
    transaction: Interfaces.ITransaction,
    expectedAmount: Utils.BigNumber = Utils.BigNumber.ZERO,
): void => {
    if (!transaction.data.amount.isEqualTo(expectedAmount)) {
        throw new WrongServiceCostError(transaction.data.id);
    }
};

export const throwIfInvalidFee = (
    transaction: Interfaces.ITransaction,
    expectedFee: Utils.BigNumber = Utils.BigNumber.ZERO,
): void => {
    if (!transaction.data.fee.isEqualTo(expectedFee)) {
        throw new WrongFeeError(transaction.data.id);
    }
};
