import { app } from "@arkecosystem/core-container";
import { EventEmitter, Logger, NFT as INFT } from "@arkecosystem/core-interfaces";
import { Bignum, constants, models } from "@arkecosystem/crypto";
import { isNftTransaction } from "./utils";

const { TransactionTypes } = constants;
const emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

export class NFTManager implements INFT.INFTManager {
    get tokens() {
        return this.registeredTokens;
    }
    public registeredTokens: { [id: string]: models.NFT };

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

    public start(): INFT.INFTManager {
        // start all event listeners
        this.eventActions.map(({ event, action }) => emitter.on(event, action.bind(this)));
        return this;
    }

    public stop() {
        this.eventActions.map(({ event, action }) => emitter.off(event, action.bind(this)));
    }

    public findById(id: Bignum): models.NFT {
        const tokenIndex = id.toString();
        return this.tokens[tokenIndex];
    }

    public isRegistered(tokenId: Bignum): boolean {
        const tokenIndex = tokenId.toString();
        return this.tokens.hasOwnProperty(tokenIndex);
    }

    private transactionApplied(transaction: models.ITransactionData) {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                if (!transaction.recipientId) {
                    logger.debug(`[NFT Manager] register new token with id '${transaction.asset.nft.tokenId}'`);
                    this.register(new models.NFT(transaction.asset.nft.tokenId));
                }
                break;
            case TransactionTypes.NftUpdate:
                logger.debug(`[NFT Manager] update token with id '${transaction.asset.nft.tokenId}' properties`);
                this.findById(transaction.asset.nft.tokenId).updateProperties(transaction.asset.nft.properties);
                break;
            default:
        }
    }

    private transactionReverted(transaction: models.ITransactionData) {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                if (!transaction.recipientId) {
                    logger.debug(`[NFT Manager] unregister token with id '${transaction.asset.nft.tokenId}'`);
                    this.delete(transaction.asset.nft.tokenId);
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

    private delete(id: Bignum): boolean {
        const tokenIndex = id.toString();
        if (this.isRegistered(id)) {
            delete this.tokens[tokenIndex];
            return true;
        }
        return false;
    }

    private register(token: models.NFT): boolean {
        const tokenIndex = token.id.toString();
        if (!this.isRegistered(token.id)) {
            this.tokens[tokenIndex] = token;
            return true;
        }
        return false;
    }
}
