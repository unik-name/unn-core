import { Address, Bignum, client, crypto, unicodeToBignum } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";
import { TransferCommand } from "./transfer";

export class NFTMintCommand extends SendCommand {
    public static description: string = "mint a non-fungible token";

    public static flags = {
        ...SendCommand.flagsSend,
        id: flags.string({
            description: "token identifier",
        }),
        nftFee: satoshiFlag({
            description: "nft fee",
            default: 1,
        }),
        unikname: flags.boolean({
            description: "token identifier is unikname",
            default: false,
        }),
    };

    protected getCommand(): any {
        return NFTMintCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        return TransferCommand.run(
            [`--amount=${flags.nftFee}`, `--number=${flags.number}`, "--skipProbing"].concat(this.castFlags(flags)),
        );
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const transactions = [];

        let id = flags.id;
        if (!id) {
            id = this.getRandomInt(1, 10000);
        } else if (flags.unikname) {
            id = unicodeToBignum(id);
        }

        for (const [address, wallet] of Object.entries(wallets)) {
            const transaction = this.signer.makeNftTransfer({
                ...flags,
                ...{
                    id,
                    passphrase: wallet.passphrase,
                },
            });

            wallets[address].expectedNft = id;

            transactions.push(transaction);
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
                const recipientId = Address.fromPublicKey(transaction.senderPublicKey, this.network.version);

                await this.knockBalance(recipientId, wallets[recipientId].expectedBalance);
                await this.knockWallet(recipientId, wallets[recipientId].expectedNft);
                await this.knockNfts(wallets[recipientId].expectedNft);
            }
        }
    }

    private async knockWallet(address: string, expected: string): Promise<void> {
        const { tokens: tokens } = (await this.api.get(`wallets/${address}`)).data;

        if (tokens.contains(expected)) {
            logger.info(`[W] ${address} (${expected})`);
        } else {
            logger.error(`[W] ${address} (${expected} / ${tokens})`);
        }
    }

    private async knockNfts(expected: string): Promise<void> {
        const actual = (await this.api.get(`nfts`)).result;

        if (actual.expected) {
            logger.info(`[W] ${expected} minted`);
        } else {
            logger.error(`[W] ${expected} not minted`);
        }
    }

    private getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
    }
}
