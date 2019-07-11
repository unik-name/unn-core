import { Address } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import { satoshiFlag } from "../../flags";
import { logger } from "../../logger";
import { SendCommand } from "../../shared/send";

export class NFTUpdateCommand extends SendCommand {
    public static description: string = "update a non-fungible token properties from A to B";

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
        // --props has to be a json string
        props: flags.string({
            description: "NFT properties to update key/value",
            required: true,
        }),
        nftFee: satoshiFlag({
            description: "nft fee",
            default: 1,
        }),
    };

    protected getCommand(): any {
        return NFTUpdateCommand;
    }

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        if (!flags.id) {
            throw new Error("[send:nftupdate] no NFT identifier (--id)");
        }

        if (!flags.props) {
            throw new Error("[send:nftupdate] no properties (--props)");
        }

        const actual = await this.api.get(`nfts/${flags.id}`);

        if (!actual) {
            throw new Error(`[send:nftupdate] no NFT with id ${flags.id}`);
        }

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

        const properties: { [_: string]: string } = this.getPropertiesFromFlag(flags.props);
        const transaction = this.signer.makeNftUpdate({
            ...flags,
            ...{
                id,
                passphrase: wallet.passphrase,
                properties,
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
                await this.knockNft(tokenId, transaction.properties);
            }
        }
    }

    private async knockNft(nftId: string, properties: { [_: string]: string }): Promise<void> {
        const actual = await this.api.get(`nfts/${nftId}`);
        const actualProperties = actual.data.properties;
        if (properties) {
            const notUpdated = [];
            const propertyKeys = Object.keys(properties);
            propertyKeys.forEach(propertyKey => {
                const propertyValue = properties[propertyKey];
                if (actualProperties[propertyKey] !== propertyValue) {
                    notUpdated.push(propertyKey);
                }
            });
            if (notUpdated.length === 0) {
                logger.info(`[💎] properties of ${nftId} have been updated`);
            } else {
                logger.error(`[💎] properties (${notUpdated}) of ${nftId} have not been updated`);
            }
        } else {
            logger.error(`[💎] no properties found on NFT ${nftId}`);
        }
    }

    private getPropertiesFromFlag(propsFlag: string): any {
        return JSON.parse(propsFlag);
    }
}
