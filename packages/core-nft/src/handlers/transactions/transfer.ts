import { Address, ITransactionData } from "@arkecosystem/crypto";
import { NFTModifier } from "../../modifier";

export abstract class NFTTransferHandler {
    public static async onApplied(transaction: ITransactionData) {
        const { senderPublicKey, asset, recipientId } = transaction;
        const { tokenId } = asset.nft;
        const sender = Address.fromPublicKey(senderPublicKey);

        return transaction.recipientId
            ? NFTModifier.updateOwner(tokenId, recipientId) // It's ownership transfer
            : NFTModifier.insert(tokenId, sender); // It's token creation
    }

    public static async onReverted(transaction: ITransactionData) {
        const { senderPublicKey, asset } = transaction;
        const { tokenId } = asset.nft;
        const sender = Address.fromPublicKey(senderPublicKey);

        return transaction.recipientId
            ? NFTModifier.updateOwner(tokenId, sender) // It's ownership transfer
            : NFTModifier.delete(tokenId); // It's token creation
    }
}
