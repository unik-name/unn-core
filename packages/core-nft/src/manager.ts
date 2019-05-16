import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, Logger, NFT } from "@arkecosystem/core-interfaces";
import { Address, constants, ITransactionData, models } from "@arkecosystem/crypto";
import { isNftTransaction } from "./utils";

const { TransactionTypes } = constants;
const emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");
const logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
const database: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");

const nftRepository = database.connection.nftsRepository;

export class NFTManager implements NFT.INFTManager {
    private eventActions = [
        {
            event: ApplicationEvents.TransactionApplied,
            action: this.transactionApplied,
        },
        {
            event: ApplicationEvents.BlockReverted,
            action: this.blockReverted,
        },
    ];

    public start(): NFT.INFTManager {
        // start all event listeners
        this.eventActions.map(({ event, action }) => emitter.on(event, action.bind(this)));
        return this;
    }

    public stop() {
        this.eventActions.map(({ event, action }) => emitter.off(event, action.bind(this)));
    }

    private transactionApplied(transaction: ITransactionData) {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                const sender = Address.fromPublicKey(transaction.senderPublicKey);
                if (!transaction.recipientId) {
                    nftRepository.insert(new models.Nft(transaction.asset.nft.tokenId, sender));
                    logger.debug(`[💎] New token (id:${transaction.asset.nft.tokenId}, owner:${sender})`);
                } else {
                    nftRepository.updateOwnerId(transaction.asset.nft.tokenId, transaction.recipientId);
                    logger.debug(
                        `[💎] Token transferred (id:'${transaction.asset.nft.tokenId}', from:${sender} ,to:${
                            transaction.recipientId
                        })`,
                    );
                }
                break;
            case TransactionTypes.NftUpdate:
                logger.debug(`[💎] Token updated (id:${transaction.asset.nft.tokenId})`);
                // TODO update in db
                break;
            default:
        }
    }

    private transactionReverted(transaction: ITransactionData) {
        switch (transaction.type) {
            case TransactionTypes.NftTransfer:
                if (!transaction.recipientId) {
                    nftRepository.delete(transaction.asset.nft.tokenId);
                    logger.debug(`[💎] Token deleted (id:${transaction.asset.nft.tokenId})`);
                } else {
                    const sender = Address.fromPublicKey(transaction.senderPublicKey);
                    nftRepository.update(new models.Nft(transaction.asset.nft.tokenId, sender));
                    logger.debug(
                        `[💎] Token backs to its previous owner (id:${transaction.asset.nft.tokenId}, to:${sender})`,
                    );
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
}
