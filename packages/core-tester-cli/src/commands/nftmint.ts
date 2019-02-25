import { Bignum, client, crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import pluralize from "pluralize";
import { customFlags } from "../flags";
import { logger, parseFee, satoshiToArk } from "../utils";
import { BaseCommand } from "./command";
import { TransferCommand } from "./transfer";

export class NFTMint extends BaseCommand {
    public static description: string = "mint a non-fungible token";

    public static flags = {
        ...BaseCommand.flags,
        id: flags.string({
            description: "token identifier",
        }),
        nftFee: customFlags.number({
            description: "nft fee",
            default: 1,
        }),
    };

    /**
     * Run vote command.
     * @return {void}
     */
    public async run(): Promise<void> {
        await this.initialize(NFTMint);

        // const wallets = this.generateWallets();

        // logger.info(`Crediting ${this.options.number} ${pluralize("wallet", this.options.number)}`);
        // for (const wallet of wallets) {
        //     await TransferCommand.run(["--recipient", wallet.address, "--amount", String(2), "--skipTesting", "--skipValidation"]);
        // }

        const senderAddress = crypto.getAddress(
            crypto.getKeys(this.config.passphrase).publicKey,
            this.config.network.version,
        );

        let id = this.options.id;
        if (!id) {
            try {
                id = this.getRandomInt(1, 10000);
            } catch (error) {
                logger.error(error);
                return;
            }
        }

        // logger.info(`Sending ${this.options.number} nft mint ${pluralize("transaction", this.options.number)}`);
        logger.info(`Sending 1 nft mint transaction for token ${id}`);

        const transactions = [];
        // wallets.forEach((wallet, i) => {
        const transaction = client
            .getBuilder()
            .nftTransfer(new Bignum(id))
            .fee(parseFee(this.options.nftFee))
            .network(this.config.network.version)
            .sign(this.config.passphrase)
            .secondSign(this.config.secondPassphrase)
            .build();

        transactions.push(transaction);

        logger.info(`==> ${transaction.id}, "${senderAddress}" (fee: ${satoshiToArk(transaction.fee)})`);
        // });

        if (this.options.copy) {
            this.copyToClipboard(transactions);
            return;
        }

        const expectedTokenCount = Object.keys(await this.getTokens()).length + 1; // wallets.length;
        if (!this.options.skipValidation) {
            logger.info(`Expected end tokens: ${expectedTokenCount}`);
        }

        try {
            await this.sendTransactions(transactions, "nft mint", !this.options.skipValidation);

            if (this.options.skipValidation) {
                return;
            }

            const tokenCount = Object.keys(await this.getTokens()).length;

            logger.info(`All transactions have been sent! Total tokens: ${tokenCount}`);

            if (tokenCount !== expectedTokenCount) {
                logger.error(`Token count incorrect. '${tokenCount}' but should be '${expectedTokenCount}'`);
            }
        } catch (error) {
            logger.error(
                `There was a problem sending transactions: ${error.response ? error.response.data.message : error}`,
            );
        }
    }

    private getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min)) + min; // The maximum is exclusive and the minimum is inclusive
    }
}
