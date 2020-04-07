import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, NFT, State } from "@arkecosystem/core-interfaces";
import { TransactionReader } from "@arkecosystem/core-transactions";
import { delegateCalculator, supplyCalculator } from "@arkecosystem/core-utils";
import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
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

    public async getNftTotalRewards(height: number, nftName: string = "unik"): Promise<Utils.BigNumber> {
        const { milestones } = app.getConfig().all();
        const reader: TransactionReader = await TransactionReader.create(this.connection, ({
            type: 3 /*UnsCertifiedNftMint*/,
            typeGroup: 2001,
        } as any) as Transactions.TransactionConstructor);

        let totalRewards: Utils.BigNumber = Utils.BigNumber.ZERO;
        let milestonesIdx: number = 0;
        while (reader.hasNext()) {
            const transactions = await reader.read();

            for (const transaction of transactions) {
                if (transaction.blockHeight > height) {
                    return totalRewards;
                }
                if (transaction.blockHeight === milestones[milestonesIdx + 1].height) {
                    milestonesIdx++;
                }
                const properties = transaction.asset.nft[nftName].properties;
                const rewards = milestones[milestonesIdx].voucherRewards[this.getNftTypeLabel(properties.type)];

                if (properties?.UnikVoucherId) {
                    totalRewards = totalRewards
                        .plus(Utils.BigNumber.make(rewards.foundation))
                        .plus(Utils.BigNumber.make(rewards.sender))
                        .plus(Utils.BigNumber.make(rewards.forger));
                }
            }
        }
        return totalRewards;
    }

    public async calculateDelegateApproval(delegate: State.IWallet, height?: number): Promise<number> {
        if (!height) {
            height = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock().data.height;
        }

        const totalSupply = Utils.BigNumber.make(supplyCalculator.calculate(height)).plus(
            await this.getNftTotalRewards(height),
        );
        const voteBalance = Utils.BigNumber.make(delegate.getAttribute<Utils.BigNumber>("delegate.voteBalance"));

        return delegateCalculator.toDecimal(voteBalance, totalSupply);
    }

    private getNftTypeLabel(type: string) {
        switch (type) {
            default:
            case "1":
                return "individual";
            case "2":
                return "organization";
            case "3":
                return "network";
        }
    }

    private parseSearchParams(params: Database.IParameters): Database.ISearchParameters {
        const nftsRepository = this.connection.db.nfts;
        const searchParameters = new SearchParameterConverter(nftsRepository.getModel()).convert(params);
        return searchParameters;
    }
}
