import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger, NFT as _NFT_ } from "@arkecosystem/core-interfaces";
import { Address, constants, ITransactionData, models } from "@arkecosystem/crypto";
import { NFT } from "./nft";
import { isNftTransaction } from "./utils";

const { TransactionTypes } = constants;
const emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

export class NFTManager implements _NFT_.INFTManager {
    get tokens() {
        return this.registeredTokens;
    }
    public registeredTokens: { [id: string]: _NFT_.INFT };

    private eventActions = [
        {
            event: "transaction.applied",
            action: this.transactionApplied,
        },
        {
            event: "block.reverted",
            action: this.blockReverted,
        },
    ];

    constructor(options) {
        this.registeredTokens = {};
    }

    public start(): _NFT_.INFTManager {
        // start all event listeners
        this.eventActions.map(({ event, action }) => emitter.on(event, action.bind(this)));
        return this;
    }

    public stop() {
        this.eventActions.map(({ event, action }) => emitter.off(event, action.bind(this)));
    }

    public findById(id: string): _NFT_.INFT {
        return this.tokens[id];
    }

    public isRegistered(id: string): boolean {
        return this.tokens.hasOwnProperty(id);
    }

    public register(token: _NFT_.INFT): boolean {
        if (!this.isRegistered(token.id)) {
            this.tokens[token.id] = token;
            return true;
        }
        return false;
    }

    private transactionApplied(transaction: ITransactionData) {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                if (!transaction.recipientId) {
                    const sender = Address.fromPublicKey(transaction.senderPublicKey);
                    logger.debug(
                        `[💎] register new token with id '${transaction.asset.nft.tokenId}' and owner ${sender}`,
                    );
                    this.register(new NFT(transaction.asset.nft.tokenId, sender));
                } else {
                    logger.debug(
                        `[💎] transfer token with id '${transaction.asset.nft.tokenId}' to ${transaction.recipientId}`,
                    );
                    this.findById(transaction.asset.nft.tokenId).updateOwner(transaction.recipientId);
                }
                break;
            case TransactionTypes.NftUpdate:
                logger.debug(`[💎] update token with id '${transaction.asset.nft.tokenId}' properties`);
                this.findById(transaction.asset.nft.tokenId).updateProperties(transaction.asset.nft.properties);
                break;
            default:
        }
    }

    private transactionReverted(transaction: ITransactionData) {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                if (!transaction.recipientId) {
                    logger.debug(`[💎] unregister token with id '${transaction.asset.nft.tokenId}'`);
                    this.delete(transaction.asset.nft.tokenId);
                } else {
                    const sender = Address.fromPublicKey(transaction.senderPublicKey);
                    logger.debug(`[💎] give token with id '${transaction.asset.nft.tokenId}' back to previous owner`);
                    this.findById(transaction.asset.nft.tokenId).updateOwner(sender);
                }
                break;
            case TransactionTypes.NftUpdate:
                /* 
                    TODO: find a way to revert update nft (get old properties values)
                    could be saving previous transaction id and apply it again
                */
                break;
            default:
        }
    }

    private blockReverted(block: models.IBlockData) {
        if (block.transactions && block.transactions.length > 0) {
            block.transactions.filter(isNftTransaction).map(this.transactionReverted);
        }
    }

    private delete(id: string): boolean {
        if (this.isRegistered(id)) {
            delete this.tokens[id];
            return true;
        }
        return false;
    }
}
