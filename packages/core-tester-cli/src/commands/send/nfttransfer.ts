import { Address, HashAlgorithms } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class NFTTransferCommand extends SendCommand {
    public static description: string = "transfer a non-fungible token from A to B";

    public static flags = {
        ...SendCommand.flagsSend,
        id: flags.string({
            description: "token identifier",
            required: true,
        }),
        owner: flags.string({
            description: "NFT owner passphrase",
            required: true,
        }),
        recipient: flags.string({
            description: "new NFT owner",
            required: true,
        }),
        nftFee: satoshiFlag({
            description: "nft fee",
            default: 1,
        }),
    };

    protected getCommand(): any {
        return NFTTransferCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        const ownerAddress = Address.fromPassphrase(flags.owner);

        const wallets = [];
        wallets[ownerAddress] = {
            address: ownerAddress,
            passphrase: flags.owner,
        };
        return wallets;
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const [address, wallet] = Object.entries(wallets)[0];

        const id = flags.id;

        const transaction = this.signer.makeNftTransfer({
            ...flags,
            ...{
                id,
                passphrase: wallet.passphrase,
            },
        });

        wallets[address].expectedNft = id;

        return [transaction];
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const recipientId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);

            const currentBalance = await this.getWalletBalance(recipientId);
            wallets[recipientId].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }

    protected async verifyTransactions(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const senderId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);
                const tokenId = wallets[senderId].expectedNft;

                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
                await this.knockWallet(senderId, tokenId);
                await this.knockWallet(transaction.recipientId, tokenId, true);
                await this.knockNft(tokenId);
            }
        }
    }

    private async knockWallet(address: string, expected: string, mustContain: boolean = false): Promise<void> {
        const contained: boolean = (await this.api.get(`wallets/${address}`)).data.tokens.includes(expected);

        if (mustContain) {
            if (contained) {
                logger.info(`[W] recipient ${address} received token ${expected}`);
            } else {
                logger.error(`[W] token ${expected} not received by ${address}`);
            }
        } else {
            if (contained) {
                logger.error(`[W] ${address} still has token ${expected}`);
            } else {
                logger.info(`[W] ${address} sent token ${expected}`);
            }
        }
    }

    private async knockNft(expected: string): Promise<void> {
        const actual = await this.api.get(`nfts/${expected}`);
        logger.info(actual ? `[W] ${expected} still exists` : `[W] ${expected} has been destroyed`);
    }
}
