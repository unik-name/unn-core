import { app } from "@arkecosystem/core-container";
import { Logger, Shared, State } from "@arkecosystem/core-interfaces";
import { Handlers, Interfaces as TransactionInterfaces } from "@arkecosystem/core-transactions";
import { Enums, Identities, Interfaces, Managers, Utils } from "@arkecosystem/crypto";
import { getTokenId } from "@uns/core-nft-crypto";
import {
    DIDTypes,
    getDidType,
    getMintVoucherRewards,
    getRewardsFromDidType,
    hasVoucher,
    isAliveDemand,
    UnsTransactionGroup,
    UnsTransactionType,
} from "@uns/crypto";
import pluralize from "pluralize";
import { WalletIndexAlreadyRegisteredError, WalletIndexNotFoundError } from "./errors";
import { TempWalletManager } from "./temp-wallet-manager";
import { Wallet } from "./wallet";
import { WalletIndex } from "./wallet-index";

export class WalletManager implements State.IWalletManager {
    // @TODO: make this private and read-only
    public logger: Logger.ILogger = app.resolvePlugin<Logger.ILogger>("logger");

    protected readonly indexes: Record<string, State.IWalletIndex> = {};
    private currentBlock: Interfaces.IBlock;

    constructor() {
        this.reset();

        this.registerIndex(State.WalletIndexes.Addresses, (index: State.IWalletIndex, wallet: State.IWallet) => {
            if (wallet.address) {
                index.set(wallet.address, wallet);
            }
        });

        this.registerIndex(State.WalletIndexes.PublicKeys, (index: State.IWalletIndex, wallet: State.IWallet) => {
            if (wallet.publicKey) {
                index.set(wallet.publicKey, wallet);
            }
        });

        this.registerIndex(State.WalletIndexes.Usernames, (index: State.IWalletIndex, wallet: State.IWallet) => {
            // TODO: uns : fix an issue in tests
            if (wallet.isDelegate() && wallet.hasAttribute("delegate.username")) {
                index.set(wallet.getAttribute("delegate.username"), wallet);
            }
        });

        this.registerIndex(State.WalletIndexes.Resignations, (index: State.IWalletIndex, wallet: State.IWallet) => {
            if (wallet.isDelegate() && wallet.getAttribute("delegate.resigned")) {
                index.set(wallet.getAttribute("delegate.username"), wallet);
            }
        });

        this.registerIndex(State.WalletIndexes.Locks, (index: State.IWalletIndex, wallet: State.IWallet) => {
            const locks = wallet.getAttribute("htlc.locks");
            if (locks) {
                for (const lockId of Object.keys(locks)) {
                    index.set(lockId, wallet);
                }
            }
        });

        this.registerIndex(State.WalletIndexes.Ipfs, (index: State.IWalletIndex, wallet: State.IWallet) => {
            const hashes = wallet.getAttribute("ipfs.hashes");
            if (hashes) {
                for (const hash of Object.keys(hashes)) {
                    index.set(hash, wallet);
                }
            }
        });
    }

    public registerIndex(name: string, indexer: State.WalletIndexer): void {
        if (this.indexes[name]) {
            throw new WalletIndexAlreadyRegisteredError(name);
        }

        this.indexes[name] = new WalletIndex(indexer);
    }

    public unregisterIndex(name: string): void {
        if (!this.indexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }

        delete this.indexes[name];
    }

    public getIndex(name: string): State.IWalletIndex {
        if (!this.indexes[name]) {
            throw new WalletIndexNotFoundError(name);
        }

        return this.indexes[name];
    }

    public getIndexNames(): string[] {
        return Object.keys(this.indexes);
    }

    public allByAddress(): ReadonlyArray<State.IWallet> {
        return this.getIndex(State.WalletIndexes.Addresses).values();
    }

    public allByPublicKey(): ReadonlyArray<State.IWallet> {
        return this.getIndex(State.WalletIndexes.PublicKeys).values();
    }

    public allByUsername(): ReadonlyArray<State.IWallet> {
        return this.getIndex(State.WalletIndexes.Usernames).values();
    }

    public findById(id: string): State.IWallet {
        for (const index of Object.values(this.indexes)) {
            const wallet: State.IWallet = index.get(id);
            if (wallet) {
                return wallet;
            }
        }

        return undefined;
    }

    public findByAddress(address: string): State.IWallet {
        const index: State.IWalletIndex = this.getIndex(State.WalletIndexes.Addresses);
        if (address && !index.has(address)) {
            index.set(address, new Wallet(address));
        }

        return index.get(address);
    }

    public findByPublicKey(publicKey: string): State.IWallet {
        const index: State.IWalletIndex = this.getIndex(State.WalletIndexes.PublicKeys);
        if (publicKey && !index.has(publicKey)) {
            const address: string = Identities.Address.fromPublicKey(publicKey);
            const wallet: State.IWallet = this.findByAddress(address);
            wallet.publicKey = publicKey;
            index.set(publicKey, wallet);
        }

        return index.get(publicKey);
    }

    public findByUsername(username: string): State.IWallet {
        return this.findByIndex(State.WalletIndexes.Usernames, username);
    }

    public findByIndex(index: string | string[], key: string): State.IWallet | undefined {
        if (!Array.isArray(index)) {
            index = [index];
        }

        for (const name of index) {
            const index = this.getIndex(name);
            if (index.has(key)) {
                return index.get(key);
            }
        }

        return undefined;
    }

    public has(key: string): boolean {
        for (const walletIndex of Object.values(this.indexes)) {
            if (walletIndex.has(key)) {
                return true;
            }
        }

        return false;
    }

    public hasByAddress(address: string): boolean {
        return this.hasByIndex(State.WalletIndexes.Addresses, address);
    }

    public hasByPublicKey(publicKey: string): boolean {
        return this.hasByIndex(State.WalletIndexes.PublicKeys, publicKey);
    }

    public hasByUsername(username: string): boolean {
        return this.hasByIndex(State.WalletIndexes.Usernames, username);
    }

    public hasByIndex(indexName: string, key: string): boolean {
        return this.getIndex(indexName).has(key);
    }

    public getNonce(publicKey: string): Utils.BigNumber {
        if (this.hasByPublicKey(publicKey)) {
            return this.findByPublicKey(publicKey).nonce;
        }

        return Utils.BigNumber.ZERO;
    }

    public forgetByAddress(address: string): void {
        this.forgetByIndex(State.WalletIndexes.Addresses, address);
    }

    public forgetByPublicKey(publicKey: string): void {
        this.forgetByIndex(State.WalletIndexes.PublicKeys, publicKey);
    }

    public forgetByUsername(username: string): void {
        this.forgetByIndex(State.WalletIndexes.Usernames, username);
    }

    public forgetByIndex(indexName: string, key: string): void {
        this.getIndex(indexName).forget(key);
    }

    public index(wallets: ReadonlyArray<State.IWallet>): void {
        for (const wallet of wallets) {
            this.reindex(wallet);
        }
    }

    public reindex(wallet: State.IWallet): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.index(wallet);
        }
    }

    public getCurrentBlock(): Readonly<Interfaces.IBlock> {
        return this.currentBlock;
    }

    public clone(): WalletManager {
        return new TempWalletManager(this);
    }

    public loadActiveDelegateList(roundInfo: Shared.IRoundInfo): State.IWallet[] {
        const delegates: State.IWallet[] = this.buildDelegateRanking(roundInfo);
        const { maxDelegates } = roundInfo;

        if (delegates.length < maxDelegates) {
            throw new Error(
                `Expected to find ${maxDelegates} delegates but only found ${delegates.length}. ` +
                    `This indicates an issue with the genesis block & delegates.`,
            );
        }

        this.logger.debug(`Loaded ${delegates.length} active ${pluralize("delegate", delegates.length)}`);

        return delegates;
    }

    // Only called during integrity verification on boot.
    public buildVoteBalances(): void {
        for (const voter of this.allByPublicKey()) {
            if (voter.hasVoted()) {
                const delegate: State.IWallet = this.findByPublicKey(voter.getAttribute<string>("vote"));
                const voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance");
                const lockedBalance = voter.getAttribute("htlc.lockedBalance", Utils.BigNumber.ZERO);
                delegate.setAttribute("delegate.voteBalance", voteBalance.plus(voter.balance).plus(lockedBalance));
                this.delegateWeightedBalance(delegate);
            }
        }
    }

    public async applyBlock(block: Interfaces.IBlock): Promise<void> {
        this.currentBlock = block;
        const generatorPublicKey: string = block.data.generatorPublicKey;

        let delegate: State.IWallet;
        if (!this.has(generatorPublicKey)) {
            const generator: string = Identities.Address.fromPublicKey(generatorPublicKey);

            if (block.data.height === 1) {
                delegate = new Wallet(generator);
                delegate.publicKey = generatorPublicKey;

                this.reindex(delegate);
            } else {
                app.forceExit(`Failed to lookup generator '${generatorPublicKey}' of block '${block.data.id}'.`);
            }
        } else {
            delegate = this.findByPublicKey(block.data.generatorPublicKey);
        }

        const appliedTransactions: Interfaces.ITransaction[] = [];

        try {
            for (const transaction of block.transactions) {
                await this.applyTransaction(transaction);
                appliedTransactions.push(transaction);
            }

            const applied: boolean = delegate.applyBlock(block.data);

            // If the block has been applied to the delegate, the balance is increased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (applied && delegate.hasVoted()) {
                const increase: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: State.IWallet = this.findByPublicKey(delegate.getAttribute<string>("vote"));
                const voteBalance: Utils.BigNumber = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.plus(increase));
            }
        } catch (error) {
            this.logger.error("Failed to apply all transactions in block - reverting previous transactions");

            // Revert the applied transactions from last to first
            for (const transaction of appliedTransactions.reverse()) {
                await this.revertTransaction(transaction);
            }

            throw error;
        } finally {
            this.currentBlock = undefined;
        }
    }

    public async revertBlock(block: Interfaces.IBlock): Promise<void> {
        if (!this.has(block.data.generatorPublicKey)) {
            app.forceExit(`Failed to lookup generator '${block.data.generatorPublicKey}' of block '${block.data.id}'.`);
        }
        this.currentBlock = block;

        const delegate: State.IWallet = this.findByPublicKey(block.data.generatorPublicKey);
        const revertedTransactions: Interfaces.ITransaction[] = [];

        try {
            // Revert the transactions from last to first
            for (let i = block.transactions.length - 1; i >= 0; i--) {
                const transaction: Interfaces.ITransaction = block.transactions[i];
                await this.revertTransaction(transaction);
                revertedTransactions.push(transaction);
            }

            const reverted: boolean = delegate.revertBlock(block.data);

            // If the block has been reverted, the balance is decreased
            // by reward + totalFee. In which case the vote balance of the
            // delegate's delegate has to be updated.
            if (reverted && delegate.hasVoted()) {
                const decrease: Utils.BigNumber = block.data.reward.plus(block.data.totalFee);
                const votedDelegate: State.IWallet = this.findByPublicKey(delegate.getAttribute<string>("vote"));
                const voteBalance: Utils.BigNumber = votedDelegate.getAttribute("delegate.voteBalance");
                votedDelegate.setAttribute("delegate.voteBalance", voteBalance.minus(decrease));
            }
        } catch (error) {
            this.logger.error(error.stack);

            for (const transaction of revertedTransactions.reverse()) {
                await this.applyTransaction(transaction);
            }

            throw error;
        } finally {
            this.currentBlock = undefined;
        }
    }

    public async applyTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const transactionHandler: Handlers.TransactionHandler = await Handlers.Registry.get(
            transaction.type,
            transaction.typeGroup,
        );

        let lockWallet: State.IWallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (
            transaction.type === Enums.TransactionType.HtlcClaim &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core
        ) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByIndex(State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        }

        // TODO: uns: find a better way to check state situation
        await transactionHandler.apply(transaction, this, true);

        const sender: State.IWallet = this.findByPublicKey(transaction.data.senderPublicKey);
        const recipient: State.IWallet = this.findByAddress(transaction.data.recipientId);

        await this.updateVoteBalances(sender, recipient, transaction.data, lockWallet, lockTransaction);
    }

    public async revertTransaction(transaction: Interfaces.ITransaction): Promise<void> {
        const { data } = transaction;

        const transactionHandler: TransactionInterfaces.ITransactionHandler = await Handlers.Registry.get(
            transaction.type,
            transaction.typeGroup,
        );
        const sender: State.IWallet = this.findByPublicKey(data.senderPublicKey);
        const recipient: State.IWallet = this.findByAddress(data.recipientId);

        // TODO: uns: find a better way to check state situation
        await transactionHandler.revert(transaction, this, true);

        let lockWallet: State.IWallet;
        let lockTransaction: Interfaces.ITransactionData;
        if (
            transaction.type === Enums.TransactionType.HtlcClaim &&
            transaction.typeGroup === Enums.TransactionTypeGroup.Core
        ) {
            const lockId = transaction.data.asset.claim.lockTransactionId;
            lockWallet = this.findByIndex(State.WalletIndexes.Locks, lockId);
            lockTransaction = lockWallet.getAttribute("htlc.locks", {})[lockId];
        }

        // Revert vote balance updates
        await this.updateVoteBalances(sender, recipient, data, lockWallet, lockTransaction, true);
    }

    public canBePurged(wallet: State.IWallet): boolean {
        return wallet.canBePurged();
    }

    public reset(): void {
        for (const walletIndex of Object.values(this.indexes)) {
            walletIndex.clear();
        }
    }

    public delegateWeightedBalance(delegate: State.IWallet): Utils.BigNumber {
        let weightedBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance");
        const voterWeight = Managers.configManager.getMilestone()?.voterMaximumWeight;
        if (voterWeight) {
            if (delegate.getAttribute<number>("delegate.type") === DIDTypes.INDIVIDUAL) {
                const voters = this.allByAddress().filter(
                    wallet => wallet.getAttribute<string>("vote", "") === delegate.publicKey,
                );
                for (const voter of voters) {
                    const maxVotes = Utils.BigNumber.make(voterWeight.individual);
                    const diff = voter.balance.comparedTo(maxVotes);
                    if (diff > 0) {
                        weightedBalance = maxVotes;
                    }
                }
            }
            delegate.setAttribute("delegate.weightedVoteBalance", weightedBalance);
        }
        return weightedBalance;
    }

    public buildDelegateRanking(roundInfo?: Shared.IRoundInfo): State.IWallet[] {
        const delegatesActive: State.IWallet[] = [];

        for (const delegate of this.allByUsername()) {
            if (delegate.hasAttribute("delegate.resigned")) {
                delegate.forgetAttribute("delegate.rank");
            } else {
                delegatesActive.push(delegate);
            }
        }

        let delegatesSorted = delegatesActive
            .sort((a, b) => {
                const voteBalanceA: Utils.BigNumber = this.delegateWeightedBalance(a);
                const voteBalanceB: Utils.BigNumber = this.delegateWeightedBalance(b);

                const diff = voteBalanceB.comparedTo(voteBalanceA);
                if (diff === 0) {
                    if (a.publicKey === b.publicKey) {
                        throw new Error(
                            `The balance and public key of both delegates are identical! Delegate "${a.getAttribute(
                                "delegate.username",
                            )}" appears twice in the list.`,
                        );
                    }

                    return a.publicKey.localeCompare(b.publicKey, "en");
                }
                return diff;
            })
            .map(
                (delegate, i): State.IWallet => {
                    const rank = i + 1;
                    delegate.setAttribute("delegate.rank", rank);
                    return delegate;
                },
            );

        if (Managers.configManager.getMilestone()?.nbDelegatesByType) {
            delegatesSorted = this.buildCustomRanking(delegatesSorted);
        }

        if (roundInfo) {
            delegatesSorted = delegatesSorted.slice(0, roundInfo.maxDelegates);
            for (const delegate of delegatesSorted) {
                delegate.setAttribute("delegate.round", roundInfo.round);
            }
        }

        return delegatesSorted;
    }

    public buildCustomRanking(delegatesSorted: State.IWallet[]): State.IWallet[] {
        const organizationDelegates = [];
        const networkDelegates = [];
        const primaryDelegates = [];

        delegatesSorted.map(delegate => {
            const delegateType = delegate.getAttribute<number>("delegate.type");
            if (delegateType === DIDTypes.ORGANIZATION) {
                organizationDelegates.push(delegate);
            } else if (delegateType === DIDTypes.NETWORK) {
                networkDelegates.push(delegate);
            } else {
                // individuals + genesis
                primaryDelegates.push(delegate);
            }
        });

        const nbNetworks = Managers.configManager.getMilestone().nbDelegatesByType.network;
        const nbIndividuals = Managers.configManager.getMilestone().nbDelegatesByType.individual;
        const nbOrganizations = Managers.configManager.getMilestone().nbDelegatesByType.organization;
        const activeDelegates = Managers.configManager.getMilestone().activeDelegates;
        const delegatesCustomSort: State.IWallet[] = [];

        let individuals = 0;
        let organizations = 0;
        let networks = 0;
        for (let rank = 0; rank < activeDelegates; rank++) {
            let delegate: State.IWallet;
            // select individuals delegates
            if (individuals < nbIndividuals) {
                if (primaryDelegates.length) {
                    delegate = primaryDelegates.shift();
                    individuals++;
                }
            }
            // select organizations
            if (!delegate && organizations < nbOrganizations) {
                if (organizationDelegates.length) {
                    delegate = organizationDelegates.shift();
                } else if (primaryDelegates.length) {
                    delegate = primaryDelegates.shift();
                }
                if (delegate) {
                    organizations++;
                }
            }
            // select networks
            if (!delegate && networks < nbNetworks) {
                if (networkDelegates.length) {
                    delegate = networkDelegates.shift();
                } else if (primaryDelegates.length) {
                    delegate = primaryDelegates.shift();
                }
                if (delegate) {
                    networks++;
                }
            }
            if (delegate) {
                // remove delegate from global list
                const delegateIdx = delegatesSorted.indexOf(delegate);
                delegatesSorted.splice(delegateIdx, 1);
                // add delegate to custom ranking
                delegatesCustomSort.push(delegate);
            }
        }

        if (delegatesCustomSort.length) {
            // insert custom ranked delegates at first places
            delegatesSorted.unshift(...delegatesCustomSort);
            // reindex ranks
            delegatesSorted.map((delegate, idx) => {
                delegate.setAttribute("delegate.rank", idx + 1);
                return delegate;
            });
        }

        return delegatesSorted;
    }

    /**
     * Updates the vote balances of the respective delegates of sender and recipient.
     * If the transaction is not a vote...
     *    1. fee + amount is removed from the sender's delegate vote balance
     *    2. amount is added to the recipient's delegate vote balance
     *
     * in case of a vote...
     *    1. the full sender balance is added to the sender's delegate vote balance
     *
     * If revert is set to true, the operations are reversed (plus -> minus, minus -> plus).
     */
    private async updateVoteBalances(
        sender: State.IWallet,
        recipient: State.IWallet,
        transaction: Interfaces.ITransactionData,
        lockWallet: State.IWallet,
        lockTransaction: Interfaces.ITransactionData,
        revert: boolean = false,
    ): Promise<void> {
        if (
            (transaction.type === Enums.TransactionType.Vote &&
                transaction.typeGroup === Enums.TransactionTypeGroup.Core) ||
            (transaction.type === UnsTransactionType.UnsVote && transaction.typeGroup === UnsTransactionGroup)
        ) {
            const vote: string = transaction.asset.votes[0];
            const delegate: State.IWallet = this.findByPublicKey(vote.substr(1));
            let voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);
            const senderLockedBalance: Utils.BigNumber = sender.getAttribute(
                "htlc.lockedBalance",
                Utils.BigNumber.ZERO,
            );

            if (vote.startsWith("+")) {
                voteBalance = revert
                    ? voteBalance.minus(sender.balance.minus(transaction.fee)).minus(senderLockedBalance)
                    : voteBalance.plus(sender.balance).plus(senderLockedBalance);
            } else {
                voteBalance = revert
                    ? voteBalance.plus(sender.balance).plus(senderLockedBalance)
                    : voteBalance.minus(sender.balance.plus(transaction.fee)).minus(senderLockedBalance);
            }

            delegate.setAttribute("delegate.voteBalance", voteBalance);
            this.delegateWeightedBalance(delegate);
        } else {
            // Update vote balance of the sender's delegate
            if (sender.hasVoted()) {
                const delegate: State.IWallet = this.findByPublicKey(sender.getAttribute("vote"));
                const amount =
                    transaction.type === Enums.TransactionType.MultiPayment &&
                    transaction.typeGroup === Enums.TransactionTypeGroup.Core
                        ? transaction.asset.payments.reduce(
                              (prev, curr) => prev.plus(curr.amount),
                              Utils.BigNumber.ZERO,
                          )
                        : transaction.amount;
                const total: Utils.BigNumber = amount.plus(transaction.fee);

                const voteBalance: Utils.BigNumber = delegate.getAttribute(
                    "delegate.voteBalance",
                    Utils.BigNumber.ZERO,
                );
                let newVoteBalance: Utils.BigNumber;

                if (
                    // handle Certified updates rewards
                    transaction.type === UnsTransactionType.UnsCertifiedNftUpdate &&
                    transaction.typeGroup === UnsTransactionGroup &&
                    Managers.configManager.getMilestone().unsTokenEcoV2 &&
                    isAliveDemand(transaction.asset)
                ) {
                    // Apply voucher rewards to delegate vote balance
                    const tokenId = getTokenId(transaction.asset);
                    const didType = sender.getAttribute("tokens")[tokenId].type;
                    if (didType === DIDTypes.INDIVIDUAL) {
                        const rewards = getRewardsFromDidType(didType);
                        newVoteBalance = revert ? voteBalance.minus(rewards.sender) : voteBalance.plus(rewards.sender);
                    }
                } else if (
                    // handle Certified mint rewards
                    transaction.type === UnsTransactionType.UnsCertifiedNftMint &&
                    transaction.typeGroup === UnsTransactionGroup &&
                    hasVoucher(transaction.asset)
                ) {
                    const didType = getDidType(transaction.asset);
                    if (!Managers.configManager.getMilestone().unsTokenEcoV2 || didType !== DIDTypes.INDIVIDUAL) {
                        // Apply voucher rewards to delegate vote balance
                        const rewards = getMintVoucherRewards(transaction.asset);
                        newVoteBalance = revert ? voteBalance.minus(rewards.sender) : voteBalance.plus(rewards.sender);
                    }
                } else if (
                    transaction.type === Enums.TransactionType.HtlcLock &&
                    transaction.typeGroup === Enums.TransactionTypeGroup.Core
                ) {
                    // HTLC Lock keeps the locked amount as the sender's delegate vote balance
                    newVoteBalance = revert ? voteBalance.plus(transaction.fee) : voteBalance.minus(transaction.fee);
                } else if (
                    transaction.type === Enums.TransactionType.HtlcClaim &&
                    transaction.typeGroup === Enums.TransactionTypeGroup.Core
                ) {
                    // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                    newVoteBalance = revert
                        ? voteBalance.plus(transaction.fee).minus(lockTransaction.amount)
                        : voteBalance.minus(transaction.fee).plus(lockTransaction.amount);
                } else {
                    // General case : sender delegate vote balance reduced by amount + fees (or increased if revert)
                    newVoteBalance = revert ? voteBalance.plus(total) : voteBalance.minus(total);
                }
                delegate.setAttribute("delegate.voteBalance", newVoteBalance);
                this.delegateWeightedBalance(delegate);
            }

            if (
                transaction.type === Enums.TransactionType.HtlcClaim &&
                transaction.typeGroup === Enums.TransactionTypeGroup.Core &&
                lockWallet.hasAttribute("vote")
            ) {
                // HTLC Claim transfers the locked amount to the lock recipient's (= claim sender) delegate vote balance
                const lockWalletDelegate: State.IWallet = this.findByPublicKey(lockWallet.getAttribute("vote"));
                const lockWalletDelegateVoteBalance: Utils.BigNumber = lockWalletDelegate.getAttribute(
                    "delegate.voteBalance",
                    Utils.BigNumber.ZERO,
                );
                lockWalletDelegate.setAttribute(
                    "delegate.voteBalance",
                    revert
                        ? lockWalletDelegateVoteBalance.plus(lockTransaction.amount)
                        : lockWalletDelegateVoteBalance.minus(lockTransaction.amount),
                );
                this.delegateWeightedBalance(lockWalletDelegate);
            }

            if (
                transaction.type === Enums.TransactionType.MultiPayment &&
                transaction.typeGroup === Enums.TransactionTypeGroup.Core
            ) {
                // go through all payments and update recipients delegates vote balance
                for (const { recipientId, amount } of transaction.asset.payments) {
                    const recipientWallet: State.IWallet = this.findByAddress(recipientId);
                    const vote = recipientWallet.getAttribute("vote");
                    if (vote) {
                        const delegate: State.IWallet = this.findByPublicKey(vote);
                        const voteBalance: Utils.BigNumber = delegate.getAttribute(
                            "delegate.voteBalance",
                            Utils.BigNumber.ZERO,
                        );
                        delegate.setAttribute(
                            "delegate.voteBalance",
                            revert ? voteBalance.minus(amount) : voteBalance.plus(amount),
                        );
                        this.delegateWeightedBalance(delegate);
                    }
                }
            }

            if (
                // handle Certified updates rewards for foundation
                transaction.type === UnsTransactionType.UnsCertifiedNftUpdate &&
                transaction.typeGroup === UnsTransactionGroup &&
                Managers.configManager.getMilestone().unsTokenEcoV2 &&
                isAliveDemand(transaction.asset)
            ) {
                const tokenId = getTokenId(transaction.asset);
                const didType = sender.getAttribute("tokens")[tokenId].type;
                if (didType === DIDTypes.INDIVIDUAL) {
                    this.applyFoundationRewardsToDelegate(didType, revert);
                }
            } else if (
                // handle Certified mint rewards
                transaction.type === UnsTransactionType.UnsCertifiedNftMint &&
                transaction.typeGroup === UnsTransactionGroup &&
                hasVoucher(transaction.asset)
            ) {
                const didType = getDidType(transaction.asset);
                if (!Managers.configManager.getMilestone().unsTokenEcoV2 || didType !== DIDTypes.INDIVIDUAL) {
                    this.applyFoundationRewardsToDelegate(didType, revert);
                }
            }

            // Update vote balance of recipient's delegate
            if (
                recipient &&
                recipient.hasVoted() &&
                (transaction.type !== Enums.TransactionType.HtlcLock ||
                    transaction.typeGroup !== Enums.TransactionTypeGroup.Core)
            ) {
                const delegate: State.IWallet = this.findByPublicKey(recipient.getAttribute("vote"));
                const voteBalance: Utils.BigNumber = delegate.getAttribute(
                    "delegate.voteBalance",
                    Utils.BigNumber.ZERO,
                );

                delegate.setAttribute(
                    "delegate.voteBalance",
                    revert ? voteBalance.minus(transaction.amount) : voteBalance.plus(transaction.amount),
                );
                this.delegateWeightedBalance(delegate);
            }
        }
    }

    private applyFoundationRewardsToDelegate(didType: DIDTypes, revert: boolean) {
        const foundationPublicKey = Managers.configManager.get("network.foundation.publicKey");
        const foundationWallet: State.IWallet = this.findByPublicKey(foundationPublicKey);
        // Apply foundation voucher rewards to delegate vote balance
        if (foundationWallet.hasVoted()) {
            const delegate: State.IWallet = this.findByPublicKey(foundationWallet.getAttribute("vote"));
            const voteBalance: Utils.BigNumber = delegate.getAttribute("delegate.voteBalance", Utils.BigNumber.ZERO);
            const rewards = getRewardsFromDidType(didType);
            delegate.setAttribute(
                "delegate.voteBalance",
                revert ? voteBalance.minus(rewards.foundation) : voteBalance.plus(rewards.foundation),
            );
            this.delegateWeightedBalance(delegate);
        }
    }
}
