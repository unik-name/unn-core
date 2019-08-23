import { Address, ITransactionData } from "@arkecosystem/crypto";
import { NFTModifier } from "../../modifier";

export abstract class NFTMintHandler {
    public static async onApplied(transaction: ITransactionData) {
        const { tokenId, properties } = transaction.asset.nft;

        const sender = Address.fromPublicKey(transaction.senderPublicKey);

        await NFTModifier.insert(tokenId, sender);

        if (properties) {
            await Promise.all(
                Object.entries(properties).map(async ([key, value]) => NFTModifier.insertProperty(key, value, tokenId)),
            );
        }
    }

    public static async onReverted(transaction: ITransactionData) {
        return NFTModifier.delete(transaction.asset.nft.tokenId);
    }
}
