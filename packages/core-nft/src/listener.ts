import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { EventEmitter } from "@arkecosystem/core-interfaces";

type NFTEventAction = (_: any) => any;
const emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

export class NFTTransactionListener {
    public static instance() {
        if (!NFTTransactionListener.singleton) {
            NFTTransactionListener.singleton = new NFTTransactionListener();
        }
        return NFTTransactionListener.singleton;
    }

    private static singleton: NFTTransactionListener;

    private registrations: Array<{ event: ApplicationEvents; action: NFTEventAction }> = [];

    private constructor() {}

    public register(event: ApplicationEvents, action: NFTEventAction): NFTTransactionListener {
        this.registrations.push({ event, action });
        return this;
    }

    public unregister(event: ApplicationEvents): NFTTransactionListener {
        this.registrations = this.registrations.filter(reg => reg.event !== event);
        return this;
    }

    public start(): NFTTransactionListener {
        this.registrations.map(({ event, action }) => emitter.on(event, action));
        return this;
    }

    public stop(): NFTTransactionListener {
        this.registrations.map(({ event, action }) => emitter.off(event, action));
        return this;
    }
}
