import { Bignum, client, crypto } from "@arkecosystem/crypto";
import { flags } from "@oclif/command";
import pluralize from "pluralize";
import { customFlags } from "../flags";
import { arktoshiToArk, logger, parseFee } from "../utils";
import { BaseCommand } from "./command";
import { TransferCommand } from "./transfer";

export class NFTTransfer extends BaseCommand {
    public static description: string = "transfer a non-fungible token";

    public static flags = {
        ...BaseCommand.flags,
        id: flags.string({
            description: "token identifier",
            required: true,
        }),
        recipient: flags.string({
            description: "recipient address",
            required: true,
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
        await this.initialize(NFTTransfer);

        const senderPubkey = crypto.getKeys(this.config.passphrase).publicKey;
        const senderAddress = crypto.getAddress(senderPubkey, this.config.network.version);

        // const wallets = this.generateWallets();

        // logger.info(`Crediting ${this.options.number} ${pluralize("wallet", this.options.number)}`);
        // for (const wallet of wallets) {
        //     await TransferCommand.run(["--recipient", wallet.address, "--amount", String(2), "--skipTesting", "--skipValidation"]);
        // }

        // logger.info(`Sending ${this.options.number} nft mint ${pluralize("transaction", this.options.number)}`);
        logger.info(`Sending 1 nft transfer transaction`);

        const transactions = [];
        // wallets.forEach((wallet, i) => {
        const transaction = client
            .getBuilder()
            .nftTransfer(new Bignum(this.options.id))
            .recipientId(this.options.recipient)
            .fee(parseFee(this.options.nftFee))
            .network(this.config.network.version)
            .senderPublicKey(senderPubkey)
            .sign(this.config.passphrase)
            .secondSign(this.config.secondPassphrase)
            .build();

        transactions.push(transaction);

        logger.info(`==> ${transaction.id}, "${senderAddress}" (fee: ${arktoshiToArk(transaction.fee)})`);
        // });

        if (this.options.copy) {
            this.copyToClipboard(transactions);
            return;
        }

        if (!this.options.skipValidation) {
            logger.info(
                `Expected token ${this.options.id} to be transferred from ${senderAddress} to ${
                    this.options.recipient
                }`,
            );
        }

        try {
            await this.sendTransactions(transactions, "nft transfer", !this.options.skipValidation);

            if (this.options.skipValidation) {
                return;
            }

            logger.info(`All transactions have been sent!`);

            const senderTokens = (await this.getWallet(senderAddress)).tokens;
            const recipientToken = (await this.getWallet(this.options.recipient)).tokens;

            if (senderTokens.includes(this.options.id)) {
                logger.error(`Token ${this.options.id} is still in sender wallet`);
            }

            if (recipientToken.includes(this.options.id)) {
                logger.error(`Token ${this.options.id} is not in recipient wallet`);
            }
        } catch (error) {
            logger.error(
                `There was a problem sending transactions: ${error.response ? error.response.data.message : error}`,
            );
        }
    }
}
