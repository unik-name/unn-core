import { flags } from "@oclif/parser";
import { networks } from "@uns/crypto";
import { Client, constants, ITransactionData } from "@uns/crypto";
import cli from "cli-ux";
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
 * Create NFTMint transaction structure
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

/**
 * Create NFTUpdate transaction structure
 * @param client
 * @param tokenId
 * @param properties
 * @param fees
 * @param networkVerion
 * @param passphrase
 */
export const createNFTUpdateTransaction = (
    client: Client,
    tokenId: string,
    properties: { [_: string]: string },
    fees: number,
    networkVerion: number,
    passphrase: string,
): ITransactionData => {
    return client
        .getBuilder()
        .nftUpdate(tokenId)
        .properties(properties)
        .fee(fees)
        .network(networkVerion)
        .sign(passphrase)
        .getStruct();
};

export const checkUnikIdFormat = (unikid: string) => {
    const valid = unikid && unikid.length === 64;
    if (!valid) {
        throw new Error("Unikid parameter does not match expected format");
    }
};

export const checkPassphraseFormat = (passphrase: string) => {
    const valid = passphrase && passphrase.split(" ").length === 12;
    if (!valid) {
        throw new Error("Wrong pass phrase format");
    }
};

export const getPassphraseFromUser = (): Promise<string> => {
    return cli.prompt("Enter your wallet passphrase (12 words phrase)", { type: "mask" });
};

export const passphraseFlag = {
    passphrase: flags.string({
        description:
            "The passphrase of the owner of UNIK. If you do not enter a passphrase you will be prompted for it.",
    }),
};

export const awaitFlag = {
    await: flags.integer({
        description: `Number of blocks to wait to get confirmed for the success. Default to 3.
            0 for immediate return.
            Needs to be strictly greater than --confirmation flag`,
        default: 3,
    }),
};

export const confirmationsFlag = {
    confirmations: flags.integer({
        description:
            "Number of confirmations to wait to get confirmed for the success. Default to 1.\n\t Needs to be strictly lower than --await flag",
        default: 1,
    }),
};

export const feeFlag = {
    fee: flags.integer({
        description: "Specify a dynamic fee in satoUNS. Defaults to 100000000 satoUNS = 1 UNS.",
        default: 100000000,
    }),
};

export const unikidFlag = (description?: string) => {
    return {
        unikid: flags.string({
            description,
            required: true,
        }),
    };
};
