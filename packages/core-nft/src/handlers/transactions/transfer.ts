import { Address, ITransactionData } from "@arkecosystem/crypto";
import { NFTModifier } from "../../modifier";

export abstract class NFTTransferHandler {
    public static async onApplied(transaction: ITransactionData) {
        return NFTModifier.updateOwner(transaction.asset.nft.tokenId, transaction.recipientId);
    }

    public static async onReverted(transaction: ITransactionData) {
        const { senderPublicKey, asset } = transaction;
        const { tokenId } = asset.nft;
        const sender = Address.fromPublicKey(senderPublicKey);

        return NFTModifier.updateOwner(tokenId, sender);
    }
}
