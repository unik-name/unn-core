import { Address, unicodeToBignumBuffer } from "@arkecosystem/crypto";
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
            exclusive: ["unikname"],
        }),
        owner: flags.string({
            description: "NFT owner passphrase",
            required: true,
        }),
        recipient: flags.string({
            description: "new NFT owner",
        }),
        nftFee: satoshiFlag({
            description: "nft fee",
            default: 1,
        }),
        unikname: flags.string({
            description: "unikname NFT",
            exclusive: ["id"],
        }),
    };

    protected getCommand(): any {
        return NFTTransferCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        if (flags.recipientId && !flags.id && !flags.unikname) {
            throw new Error("[send:nfttransfer] no NFT identifier (--id or --unikname)");
        }

        const ownerAddress = Address.fromPassphrase(flags.owner);

        await TransferCommand.run(
            [`--amount=${flags.nftFee}`, `--recipient=${ownerAddress}`, "--skipProbing"].concat(this.castFlags(flags)),
        );

        const wallets = [];
        wallets[ownerAddress] = {
            address: ownerAddress,
            passphrase: flags.owner,
        };
        return wallets;
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const [address, wallet] = Object.entries(wallets)[0];

        let id = flags.id;

        if (flags.unikname) {
            id = unicodeToBignumBuffer(flags.unikname).toString();
        } else if (!flags.recipient && !id) {
            id = this.getRandomInt(1, 10000);
        }

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
                const recipient = transaction.recipientId;

                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
                await this.knockWallet(senderId, tokenId, !recipient);
                await this.knockNfts(tokenId);

                if (recipient) {
                    await this.knockWallet(transaction.recipientId, tokenId, true);
                }
            }
        }
    }

    private async knockWallet(address: string, expected: string, mustContain: boolean = false): Promise<void> {
        const tokens: string[] = (await this.api.get(`wallets/${address}`)).data.tokens.map(token =>
            Buffer.from(token).toString(),
        );
        const contained: boolean = tokens.includes(expected);

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

    private async knockNfts(expected: string): Promise<void> {
        const actual = (await this.api.get(`nfts`)).result;

        if (actual[expected]) {
            logger.info(`[W] ${expected} still exists`);
        } else {
            logger.error(`[W] ${expected} has been destroyed`);
        }
    }

    private getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
    }
}
