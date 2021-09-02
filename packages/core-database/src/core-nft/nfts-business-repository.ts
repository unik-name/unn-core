import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, NFT, State } from "@arkecosystem/core-interfaces";
import { TransactionReader } from "@arkecosystem/core-transactions";
import { delegateCalculator, supplyCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Managers, Transactions, Utils } from "@arkecosystem/crypto";
import { getTokenId } from "@uns/core-nft-crypto";
import {
    DIDHelpers,
    DIDTypes,
    getDidType,
    getRewardsFromDidType,
    hasVoucher,
    isAliveDemand,
    UnsTransactionGroup,
    UnsTransactionType,
} from "@uns/crypto";
import limitRows from "../repositories/utils/limit-rows";
import { SearchParameterConverter } from "../repositories/utils/search-parameter-converter";

export class NftsBusinessRepository implements NFT.INftsBusinessRepository {
    constructor(private connection) {} // TODO: uns : connection is voluntarily not typed to prevent cast to PostgresConnection. Warning : it won't work if it's not postgres connection or if `db` became private

    public findById(id: string, nftName?: string) {
        return this.connection.db.nfts.findById(id, nftName);
    }

    public async findProperties(id: string, params: Database.IParameters = {}) {
        const properties = await this.connection.db.nfts.findProperties(id);
        return {
            rows: limitRows(properties, params),
            count: properties.length,
        };
    }

    public findProperty(id: string, key: string) {
        return this.connection.db.nfts.findPropertyByKey(id, key);
    }

    public findPropertyBatch(ids: string[], key: string) {
        return this.connection.db.nfts.findPropertyBatch(ids, key);
    }

    public findEdgeTransactions(id: string, nftName: string): Promise<any> {
        return this.connection.db.nfts.findEdgeTransactions(id, nftName);
    }

    public async search(params: Database.IParameters) {
        return this.connection.db.nfts.search(this.parseSearchParams(params));
    }

    public status(nftName: string) {
        return this.connection.db.nfts.status(nftName);
    }

    public async findTransactionsByAsset(
        asset: any,
        types: number[],
        typeGroup: number,
        order: string = "asc",
    ): Promise<Interfaces.ITransactionData[]> {
        return this.connection.db.nfts.findTransactionsByAsset(asset, types, typeGroup, order);
    }

    public async getNftTotalRewards(height: number): Promise<Utils.BigNumber> {
        // get nft mint transactions
        let reader: TransactionReader = await TransactionReader.create(this.connection, ({
            type: UnsTransactionType.UnsCertifiedNftMint,
            typeGroup: UnsTransactionGroup,
        } as any) as Transactions.TransactionConstructor);

        let totalRewards: Utils.BigNumber = Utils.BigNumber.ZERO;
        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                if (transaction.blockHeight > height) {
                    break;
                }
                const didType: DIDTypes = getDidType(transaction.asset);
                if (
                    hasVoucher(transaction.asset) &&
                    (!Managers.configManager.getMilestone(transaction.blockHeight).unsTokenEcoV2 ||
                        didType !== DIDTypes.INDIVIDUAL)
                ) {
                    const rewards = getRewardsFromDidType(didType, transaction.blockHeight);
                    totalRewards = totalRewards
                        .plus(Utils.BigNumber.make(rewards.foundation))
                        .plus(Utils.BigNumber.make(rewards.sender))
                        .plus(Utils.BigNumber.make(rewards.forger));
                }
            }
        }
        const walletManager: State.IWalletManager = this.connection.walletManager;

        // get nft update transactions
        reader = await TransactionReader.create(this.connection, ({
            type: UnsTransactionType.UnsCertifiedNftUpdate,
            typeGroup: UnsTransactionGroup,
        } as any) as Transactions.TransactionConstructor);

        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                if (transaction.blockHeight > height) {
                    return totalRewards;
                }
                if (
                    Managers.configManager.getMilestone(transaction.blockHeight).unsTokenEcoV2 &&
                    isAliveDemand(transaction.asset)
                ) {
                    const senderWallet: State.IWallet = walletManager.findByPublicKey(transaction.senderPublicKey);
                    const tokenId = getTokenId(transaction.asset);
                    const didType: DIDTypes = senderWallet.getAttribute("tokens")[tokenId].type;
                    if (didType === DIDTypes.INDIVIDUAL) {
                        const rewards = getRewardsFromDidType(didType, transaction.blockHeight);

                        totalRewards = totalRewards
                            .plus(Utils.BigNumber.make(rewards.foundation))
                            .plus(Utils.BigNumber.make(rewards.sender))
                            .plus(Utils.BigNumber.make(rewards.forger));
                    }
                }
            }
        }
        return totalRewards;
    }

    public async calculateDelegateApproval(delegate: State.IWallet, totalVotes): Promise<number> {
        let voteBalance = delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance");
        let totalVotesByType: Utils.BigNumber;
        if (Managers.configManager.getMilestone()?.nbDelegatesByType) {
            if (!delegate.hasAttribute("delegate.type")) {
                // Case of genesis delegate
                return 0;
            }
            if (delegate.hasAttribute("delegate.weightedVoteBalance")) {
                voteBalance = delegate.getAttribute<Utils.BigNumber>("delegate.weightedVoteBalance");
            }

            totalVotesByType =
                totalVotes[DIDHelpers.fromCode(delegate.getAttribute<number>("delegate.type")).toLowerCase()];
        } else {
            const height = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock().data.height;
            totalVotesByType = Utils.BigNumber.make(supplyCalculator.calculate(height)).plus(
                await this.getNftTotalRewards(height),
            );
        }

        if (totalVotesByType.isZero()) {
            return 0;
        }
        return delegateCalculator.toDecimal(voteBalance, totalVotesByType);
    }

    public getTotalVotesByType() {
        const delegates: ReadonlyArray<State.IWallet> = this.connection.walletManager.allByUsername();
        const totalVotes = {
            individual: Utils.BigNumber.ZERO,
            organization: Utils.BigNumber.ZERO,
            network: Utils.BigNumber.ZERO,
        };
        if (Managers.configManager.getMilestone()?.nbDelegatesByType) {
            // Sum weighted votes balances by type
            for (const delegate of delegates) {
                const type = delegate.getAttribute<number>("delegate.type");
                const voteBalance = delegate.hasAttribute("delegate.weightedVoteBalance")
                    ? delegate.getAttribute("delegate.weightedVoteBalance")
                    : delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance");
                if (type === DIDTypes.INDIVIDUAL) {
                    totalVotes.individual = totalVotes.individual.plus(voteBalance);
                } else if (type === DIDTypes.ORGANIZATION) {
                    totalVotes.organization = totalVotes.organization.plus(voteBalance);
                } else if (type === DIDTypes.NETWORK) {
                    totalVotes.network = totalVotes.network.plus(voteBalance);
                }
            }
        }
        return totalVotes;
    }

    private parseSearchParams(params: Database.IParameters): Database.ISearchParameters {
        const nftsRepository = this.connection.db.nfts;
        const searchParameters = new SearchParameterConverter(nftsRepository.getModel()).convert(params);
        return searchParameters;
    }
}
