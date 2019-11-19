import { Identities, Interfaces } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { getCurrentNftAsset } from "@uns/core-nft-crypto";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { NftSendCommand } from "../../shared/nft-send";
import { SendCommand } from "../../shared/send";

export const getNftUpdateFlags = (propsRequired: boolean = true) => {
    return {
        ...SendCommand.flagsSend,
        id: flags.string({
            description: "token identifier",
            required: true,
        }),
        owner: flags.string({
            description: "NFT owner passphrase",
            required: true,
        }),
        // --props has to be a json string
        props: flags.string({
            description: "NFT properties to update key/value",
            required: propsRequired,
        }),
        nftFee: satoshiFlag({
            description: "nft fee",
            default: 1,
        }),
    };
};

export class NFTUpdateCommand extends NftSendCommand {
    public static description: string = "update a non-fungible token properties from A to B";

    public static flags = getNftUpdateFlags();

    protected getCommand(): any {
        return NFTUpdateCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        const ownerAddress = Identities.Address.fromPassphrase(flags.owner);

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

        const transaction = this.getSigner({
            ...flags,
            id,
            passphrase: wallet.passphrase,
            properties: this.getPropertiesFromFlag(flags.props),
        });

        wallets[address].expectedNft = id;
        return [transaction];
    }

    protected async expectBalances(transactions, wallets): Promise<void> {
        for (const transaction of transactions) {
            const recipientId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);

            const currentBalance = await this.getWalletBalance(recipientId);
            wallets[recipientId].expectedBalance = currentBalance.minus(transaction.fee);
        }
    }

    protected async verifyTransactions(transactions: Interfaces.ITransactionData[], wallets): Promise<void> {
        for (const transaction of transactions) {
            const wasCreated = await this.knockTransaction(transaction.id);

            if (wasCreated) {
                const senderId = Identities.Address.fromPublicKey(transaction.senderPublicKey, this.network);
                const tokenId = wallets[senderId].expectedNft;

                await this.knockBalance(senderId, wallets[senderId].expectedBalance);
                await this.knockNftProperties(tokenId, getCurrentNftAsset(transaction.asset).properties);
            }
        }
    }

    protected getSigner(opts) {
        return this.nftSigner.makeNftUpdate(opts);
    }

    private async knockNftProperties(nftId: string, properties: { [_: string]: string }): Promise<void> {
        if (properties) {
            for (const [key, value] of Object.entries(properties)) {
                let result;
                try {
                    const { data } = await this.api.get(`nfts/${nftId}/properties/${key}`, false);
                    result = data;
                } catch (e) {
                    result = undefined;
                }

                if (result === value) {
                    logger.info(`[💎] property ${key} of ${nftId} is updated`);
                } else {
                    logger.error(`[💎] property ${key} of ${nftId} is not updated`);
                }
            }
        }
    }

    private getPropertiesFromFlag(propsFlag: string): any {
        return propsFlag ? JSON.parse(propsFlag) : undefined;
    }
}
