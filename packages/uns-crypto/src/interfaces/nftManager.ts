import { Interfaces } from "@arkecosystem/crypto";

interface INFTManager {
    startListening(): INFTManager;
    stopListening(): INFTManager;
    applyConstraints(transaction: Interfaces.ITransactionData): Promise<void>;
    checkGenesisProperties(properties: { [_: string]: string }): void;
}

export { INFTManager };
