import { Address } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class NFTTransferCommand extends SendCommand {
    public static description: string = "transfer a non-fungible token";

    public static flags = {
        ...SendCommand.flagsSend,
        id: flags.string({
            description: "token identifier",
            required: true,
        }),
        recipient: flags.string({
            description: "recipient address",
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
        return TransferCommand.run(
            [`--amount=${flags.nftFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        for (const [address, wallet] of Object.entries(wallets)) {
            const transaction = this.signer.makeNftTransfer({
                ...flags,
                ...{
                    passphrase: wallet.passphrase,
                },
            });

            wallets[address].expectedNft = flags.id;

            transaction.transactions.push(transaction);
        }

        return transactions;
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
                const recipientId = Address.fromPublicKey(transaction.recipientId, this.network.version);
                const tokenId = wallets[senderId].expectedNft;

                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
                await this.knockWallet(senderId, tokenId);
                await this.knockWallet(recipientId, tokenId, true);
                await this.knockNfts(tokenId);
            }
        }
    }

    private async knockWallet(address: string, expected: string, mustContain: boolean = false): Promise<void> {
        const { tokens: tokens } = (await this.api.get(`wallets/${address}`)).data;

        if (mustContain) {
            if (tokens.contains(expected)) {
                logger.info(`[W] recipient ${address} received token ${expected} `);
            } else {
                logger.error(`[W] token ${expected} not received by ${address}`);
            }
        } else {
            if (tokens.contains(expected)) {
                logger.error(`[W] ${address} still has token ${expected}`);
            } else {
                logger.info(`[W] ${address} sent token ${expected}`);
            }
        }
    }

    private async knockNfts(expected: string): Promise<void> {
        const actual = (await this.api.get(`nfts`)).result;

        if (actual.expected) {
            logger.info(`[W] ${expected} still exists`);
        } else {
            logger.error(`[W] ${expected} has been destroyed`);
        }
    }
}
