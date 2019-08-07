import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { NFT } from "@arkecosystem/core-interfaces";
import { NFTEventHandler } from "./handlers/event";
import { NFTTransactionListener } from "./listener";

export class NFTManager implements NFT.INFTManager {
    private eventListener: NFTTransactionListener;

    constructor() {
        this.eventListener = NFTTransactionListener.instance()
            .register(ApplicationEvents.TransactionApplied, NFTEventHandler.onTransactionApplied)
            .register(ApplicationEvents.BlockReverted, NFTEventHandler.onBlockReverted);
    }

    public startListening(): NFT.INFTManager {
        this.eventListener.start();
        return this;
    }
    public stopListening(): NFT.INFTManager {
        this.eventListener.stop();
        return this;
    }
}
