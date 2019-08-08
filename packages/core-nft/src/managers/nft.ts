import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { NFT } from "@arkecosystem/core-interfaces";
import { ITransactionData } from "@arkecosystem/crypto";
import { NFTEventHandler } from "../handlers/event";
import { NFTTransactionListener } from "../listener";
import { ConstraintsManager } from "./constraints";

export class NFTManager implements NFT.INFTManager {
    private eventListener: NFTTransactionListener;
    private constraintsManager: ConstraintsManager;

    constructor() {
        this.eventListener = NFTTransactionListener.instance()
            .register(ApplicationEvents.TransactionApplied, NFTEventHandler.onTransactionApplied)
            .register(ApplicationEvents.BlockReverted, NFTEventHandler.onBlockReverted);

        this.constraintsManager = new ConstraintsManager();
    }

    public startListening(): NFT.INFTManager {
        this.eventListener.start();
        return this;
    }
    public stopListening(): NFT.INFTManager {
        this.eventListener.stop();
        return this;
    }

    public async applyConstraints(transaction: ITransactionData) {
        const { properties } = transaction.asset.nft;
        for (const [key, value] of Object.entries(properties)) {
            await this.constraintsManager.getAndApplyConstraints({
                propertyKey: key,
                propertyNewValue: value,
                transaction,
            });
        }
    }
}
