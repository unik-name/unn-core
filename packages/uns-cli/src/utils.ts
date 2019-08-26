import { networks } from "@uns/crypto";
import { Client, constants, ITransactionData } from "@uns/crypto";
import { NETWORKS } from "./config";

export const getNetworksList = (): string[] => {
    return [
        ...Object.keys(networks).filter(
            network => network !== "unitnet" && network !== "mainnet" && network !== "testnet",
        ),
        "local",
    ];
};

export const getNetworksListListForDescription = () => {
    return `[${this.getNetworksList().join("|")}]`;
};

export const getNetwork = (network: string): any => {
    return NETWORKS[network];
};

/**
 * Create transaction structure
 * @param client
 * @param tokenId
 * @param passphrase
 * @param networkVerion
 */
export const createNFTMintTransaction = (
    client: Client,
    tokenId: string,
    tokenType: string,
    passphrase: string,
    networkVerion: number,
): ITransactionData => {
    return client
        .getBuilder()
        .nftMint(tokenId)
        .properties({ type: tokenType })
        .fee(client.getFeeManager().get(constants.TransactionTypes.NftTransfer))
        .network(networkVerion)
        .sign(passphrase)
        .getStruct();
};
