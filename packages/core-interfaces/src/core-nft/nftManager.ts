import { ITransactionData } from "@arkecosystem/crypto";

interface TransactionNFTAsset {
    tokenId: string;
    properties?: { [_: string]: string };
}
interface INFTManager {
    startListening(): INFTManager;
    stopListening(): INFTManager;
    applyConstraints(transaction: ITransactionData): Promise<void>;
}

export { TransactionNFTAsset, INFTManager };
