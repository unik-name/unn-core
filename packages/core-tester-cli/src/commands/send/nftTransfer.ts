import { Identities, Interfaces } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { logger } from "../../logger";
import { NftSendCommand } from "../../shared/nft-send";

export class NFTTransferCommand extends NftSendCommand {
    public static description: string = "transfer a non-fungible token to another wallet";

    public static flags = {
        ...NftSendCommand.nftFlags,
        recipient: flags.string({
            description: "recipient address",
            required: true,
        }),
    };

    protected getCommand(): any {
        return NFTTransferCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        const ownerAddress = Identities.Address.fromPassphrase(flags.passphrase);

        const wallets = [];
        wallets[ownerAddress] = {
            address: ownerAddress,
            passphrase: flags.passphrase,
        };
        return wallets;
    }

    protected async signTransactions(flags: Record<string, any>, wallets: Record<string, any>): Promise<any[]> {
        const [address] = Object.entries(wallets)[0];

        const transaction = this.getSigner({
            ...flags,
        });

        wallets[address].expectedNft = flags.id;
        return [transaction];
    }

    protected getSigner(opts) {
        return this.nftSigner.makeNftTransfer(opts);
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const sender = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

            const currentBalance = await this.getWalletBalance(sender);
            wallets[sender].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }

    protected async verifyTransactions(transactions: Interfaces.ITransactionData[], wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const senderId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
                const tokenId = wallets[senderId].expectedNft;

                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
                await this.knockNft(tokenId);
            }
        }
    }

    private async knockNft(expected: string): Promise<void> {
        const actual = await this.api.get(`nfts/${expected}`);
        logger.info(actual ? `[W] ${expected} still exists` : `[W] ${expected} has been destroyed`);
    }
}
