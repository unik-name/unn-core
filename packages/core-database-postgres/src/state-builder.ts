import { app } from "@arkecosystem/core-container";
import { ApplicationEvents } from "@arkecosystem/core-event-emitter";
import { Database, EventEmitter, Logger, State } from "@arkecosystem/core-interfaces";
import { Handlers, TransactionReader } from "@arkecosystem/core-transactions";
import { Identities, Utils } from "@arkecosystem/crypto";
import { Enums, getCurrentNftAsset } from "@uns/core-nft-crypto";
import { UnsTransactionGroup, UnsTransactionType } from "@uns/crypto";
import forOwn from "lodash.forown";

export class StateBuilder {
    private readonly logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");
    private readonly emitter: EventEmitter.EventEmitter = app.resolvePlugin<EventEmitter.EventEmitter>("event-emitter");

    constructor(
        private readonly connection: Database.IConnection,
        private readonly walletManager: State.IWalletManager,
    ) {}

    public async run(): Promise<void> {
        const nftRepo = (this.connection as any).db.nfts;
        this.logger.info("Deleting NFT table and associated properties");
        await nftRepo.truncate();

        const start = Date.now();
        if (Handlers.Registry.isKnownWalletAttribute("tokens")) {
            await this.bootstrapNftDatabase();
            this.logger.info(`Nft database bootstrap complete!  (${Date.now() - start}ms)`);
        }

        const transactionHandlers: Handlers.TransactionHandler[] = Handlers.Registry.getAll();
        const steps = transactionHandlers.length + 3;

        this.logger.info(`State Generation - Step 1 of ${steps}: Block Rewards`);
        await this.buildBlockRewards();

        this.logger.info(`State Generation - Step 2 of ${steps}: Fees & Nonces`);
        await this.buildSentTransactions();

        const capitalize = (key: string) => key[0].toUpperCase() + key.slice(1);
        for (let i = 0; i < transactionHandlers.length; i++) {
            const transactionHandler = transactionHandlers[i];
            this.logger.info(
                `State Generation - Step ${3 + i} of ${steps}: ${capitalize(transactionHandler.getConstructor().key)}`,
            );

            await transactionHandler.bootstrap(this.connection, this.walletManager);
        }

        this.logger.info(`State Generation - Step ${steps} of ${steps}: Vote Balances & Delegate Ranking`);
        this.walletManager.buildVoteBalances();
        this.walletManager.buildDelegateRanking();

        this.logger.info(`State Generation complete!  (${Date.now() - start}ms)`);
        this.logger.info(`Wallets in memory: ${Object.keys(this.walletManager.allByAddress()).length}`);
        this.logger.info(`Number of registered delegates: ${Object.keys(this.walletManager.allByUsername()).length}`);

        await this.verifyNftTableConsistency();
        await this.verifyWalletsConsistency();

        this.emitter.emit(ApplicationEvents.StateBuilderFinished);
    }

    private async buildBlockRewards(): Promise<void> {
        const blocks = await this.connection.blocksRepository.getBlockRewards();

        for (const block of blocks) {
            const wallet = this.walletManager.findByPublicKey(block.generatorPublicKey);
            wallet.balance = wallet.balance.plus(block.reward);
        }
    }

    private async buildSentTransactions(): Promise<void> {
        const transactions = await this.connection.transactionsRepository.getSentTransactions();

        for (const transaction of transactions) {
            const wallet = this.walletManager.findByPublicKey(transaction.senderPublicKey);
            wallet.nonce = Utils.BigNumber.make(transaction.nonce);
            wallet.balance = wallet.balance.minus(transaction.amount).minus(transaction.fee);
        }
    }

    private async verifyNftTableConsistency(): Promise<void> {
        const nftMintCount = await this.connection.transactionsRepository.getCountOfType(
            Enums.NftTransactionType.NftMint,
            Enums.NftTransactionGroup,
        );
        const certifiedNftMintCount = await this.connection.transactionsRepository.getCountOfType(
            UnsTransactionType.UnsCertifiedNftMint,
            UnsTransactionGroup,
        );
        const nftCount = await (this.connection as any).db.nfts.count();
        // Sum of all mint & certified mint should be equals to the nft count
        if (+nftCount !== nftMintCount + certifiedNftMintCount) {
            this.logger.warn(
                `Unikname count in db (${nftCount}) does not match mint transactions count (${nftMintCount +
                    certifiedNftMintCount}).`,
            );
            throw new Error("Nft count in database does not match mint transactions count.");
        }
    }

    private async verifyWalletsConsistency(): Promise<void> {
        const genesisPublicKeys: Record<string, true> = app
            .getConfig()
            .get("genesisBlock.transactions")
            .reduce((acc, curr) => Object.assign(acc, { [curr.senderPublicKey]: true }), {});

        let unikCount = 0;
        for (const wallet of this.walletManager.allByAddress()) {
            if (wallet.balance.isLessThan(0) && !genesisPublicKeys[wallet.publicKey]) {
                // Senders of whitelisted transactions that result in a negative balance,
                // also need to be special treated during bootstrap. Therefore, specific
                // senderPublicKey/nonce pairs are allowed to be negative.
                // Example:
                //          https://explorer.ark.io/transaction/608c7aeba0895da4517496590896eb325a0b5d367e1b186b1c07d7651a568b9e
                //          Results in a negative balance (-2 ARK) from height 93478 to 187315
                const negativeBalanceExceptions: Record<string, Record<string, string>> = app
                    .getConfig()
                    .get("exceptions.negativeBalances", {});
                const negativeBalances: Record<string, string> = negativeBalanceExceptions[wallet.publicKey] || {};
                if (!wallet.balance.isEqualTo(negativeBalances[wallet.nonce.toString()] || 0)) {
                    this.logger.warn(`Wallet '${wallet.address}' has a negative balance of '${wallet.balance}'`);
                    throw new Error("Non-genesis wallet with negative balance.");
                }
            }

            const voteBalance: Utils.BigNumber = wallet.getAttribute("delegate.voteBalance");
            if (voteBalance && voteBalance.isLessThan(0)) {
                this.logger.warn(`Wallet ${wallet.address} has a negative vote balance of '${voteBalance}'`);

                throw new Error("Wallet with negative vote balance.");
            }

            if (Handlers.Registry.isKnownWalletAttribute("tokens") && wallet.hasAttribute("tokens")) {
                const tokens = Object.keys(wallet.getAttribute("tokens"));
                unikCount += tokens.length;
            }
        }

        const nftRepo = (this.connection as any).db.nfts;
        const countFromDb = await nftRepo.count();
        if (+countFromDb !== unikCount) {
            this.logger.warn(
                `Unikname count in db ${countFromDb} doesnt match wallets attribute unikname count ${unikCount}.`,
            );
            throw new Error("Unikname count in db doesnt match wallets unikname count.");
        }
    }

    private async bootstrapNftDatabase(): Promise<void> {
        // Build nft table
        await this.bootstrapNftMints();
        await this.bootstrapNftLifeCycle();
    }

    private async bootstrapNftMints(): Promise<void> {
        const mintHandler = await Handlers.Registry.get(
            Enums.NftTransactionType.NftMint,
            Enums.NftTransactionGroup,
            true,
        );
        const certifiedMintHandler = await Handlers.Registry.get(
            UnsTransactionType.UnsCertifiedNftMint,
            UnsTransactionGroup,
            true,
        );

        for (const handler of [mintHandler, certifiedMintHandler]) {
            const reader: TransactionReader = await TransactionReader.create(this.connection, handler.getConstructor());

            while (reader.hasNext()) {
                const transactions = await reader.read();

                let formatedProps: Array<{ nftid: string; key: string; value: string }> = [];

                const nfts = transactions.map(tx => {
                    const { tokenId, properties } = getCurrentNftAsset(tx.asset);
                    const ownerId = Identities.Address.fromPublicKey(tx.senderPublicKey);

                    // Format properties and remove nulls
                    forOwn(properties, (value, key) => {
                        if (value === null) {
                            delete properties[key];
                        } else {
                            formatedProps = [...formatedProps, { nftid: tokenId, key, value }];
                        }
                    });

                    return { id: tokenId, ownerId };
                });

                // Save changes in database
                const nftRepo = (this.connection as any).db.nfts;
                await Promise.all([nftRepo.insert(nfts), nftRepo.insertManyProperties(formatedProps)]);
            }
        }
    }

    private async bootstrapNftLifeCycle(): Promise<void> {
        // We bootstrap only certified handlers
        const updateHandler = await Handlers.Registry.get(
            UnsTransactionType.UnsCertifiedNftUpdate,
            UnsTransactionGroup,
            true,
        );
        const transferHandler = await Handlers.Registry.get(
            UnsTransactionType.UnsCertifiedNftTransfer,
            UnsTransactionGroup,
            true,
        );

        const reader: TransactionReader = await TransactionReader.create(this.connection, [
            updateHandler.getConstructor(),
            transferHandler.getConstructor(),
        ]);

        const nftRepo = (this.connection as any).db.nfts;

        while (reader.hasNext()) {
            const transactions = await reader.read();

            let formatedProps: Array<{ nftid: string; key: string; value: string }> = [];

            const nftTransfers = transactions
                .map(tx => {
                    const { tokenId, properties } = getCurrentNftAsset(tx.asset);

                    // Format properties and remove nulls
                    forOwn(properties, (value, key) => {
                        formatedProps = [...formatedProps, { nftid: tokenId, key, value }];
                    });

                    if (tx.type === UnsTransactionType.UnsCertifiedNftTransfer) {
                        return { id: tokenId, newOwnerId: tx.recipientId };
                    }
                    return undefined;
                })
                .filter(t => !!t);

            console.log("nftTransfers", nftTransfers);
            // Save changes in database
            let promises = [nftRepo.updateOrDeleteManyProperties(formatedProps)];
            if (nftTransfers.length) {
                promises = [...promises, nftRepo.updateManyOwnerId(nftTransfers)];
            }
            await Promise.all(promises);
        }
    }
}
