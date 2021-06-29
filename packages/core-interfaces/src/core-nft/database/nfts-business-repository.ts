import { Interfaces, Utils } from "@arkecosystem/crypto";
import { Database, State } from "../..";

export interface INftsBusinessRepository {
    findById(id: string): Promise<any>;
    findProperties(id: string, params?: Database.IParameters): Promise<any>;
    findProperty(id: string, key: string): Promise<any>;
    findPropertyBatch(nftid: string[], key: string): Promise<any>;
    findEdgeTransactions(id: string, nftName: string): Promise<any>;
    search(params: Database.IParameters): Promise<any>;
    findTransactionsByAsset(
        asset: any,
        types: number[],
        typeGroups: number[],
        order?: string,
    ): Promise<Interfaces.ITransactionData[]>;
    getNftTotalRewards(height: number, nftName?: string): Promise<Utils.BigNumber>;
    getTotalSupply(height: number): Promise<Utils.BigNumber>;
    calculateDelegateApproval(
        delegate: State.IWallet,
        totalVotes: { individual: Utils.BigNumber; organization: Utils.BigNumber; network: Utils.BigNumber },
    ): Promise<number>;
    getTotalVotesByType(
        delegates: ReadonlyArray<State.IWallet>,
    ): { individual: Utils.BigNumber; organization: Utils.BigNumber; network: Utils.BigNumber };
}
