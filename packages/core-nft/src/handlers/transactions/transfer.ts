import { Address, getCurrentNftAsset, ITransactionData } from "@arkecosystem/crypto";
import { NFTModifier } from "../../modifier";

export abstract class NFTTransferHandler {
    public static async onApplied(transaction: ITransactionData) {
        return NFTModifier.updateOwner(getCurrentNftAsset(transaction).tokenId, transaction.recipientId);
    }

    public static async onReverted(transaction: ITransactionData) {
        const { senderPublicKey } = transaction;
        const { tokenId } = getCurrentNftAsset(transaction);
        const sender = Address.fromPublicKey(senderPublicKey);

        return NFTModifier.updateOwner(tokenId, sender);
    }
}
