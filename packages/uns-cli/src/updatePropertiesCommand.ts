import { CommandOutput } from "./formater";
import {
    awaitFlag,
    checkPassphraseFormat,
    checkUnikIdFormat,
    confirmationsFlag,
    createNFTUpdateTransaction,
    getPassphraseFromUser,
    passphraseFlag,
    unikidFlag,
} from "./utils";
import { WriteCommand } from "./writeCommand";

export abstract class UpdateProperties extends WriteCommand {
    public static flags = {
        ...WriteCommand.flags,
        ...unikidFlag("The UNIK token on which to update the properties."),
        ...awaitFlag,
        ...confirmationsFlag,
        ...passphraseFlag,
    };

    protected abstract getProperties(flags: Record<string, any>): { [_: string]: string };

    protected async do(flags: Record<string, any>): Promise<CommandOutput> {
        // Check unikid format
        checkUnikIdFormat(flags.unikid);

        // Get passphrase
        let passphrase = flags.passphrase;
        if (!passphrase) {
            passphrase = await getPassphraseFromUser();
        }

        // Check passphrase format
        checkPassphraseFormat(passphrase);

        const properties = this.getProperties(flags);

        // Update transaction
        const transactionStruct = createNFTUpdateTransaction(
            this.client,
            flags.unikid,
            properties,
            flags.fee,
            this.api.getVersion(),
            passphrase,
        );

        this.log("Binding new propert" + (Object.keys(properties).length > 1 ? "ies" : "y") + " to UNIK.");
        const sendResult = await this.api.sendTransaction(transactionStruct);
        if (sendResult.errors) {
            throw new Error(`Transaction not accepted. Caused by: ${JSON.stringify(sendResult.errors)}`);
        }
        this.actionStart("Waiting for transaction confirmation");
        const finalTransaction = await this.waitTransactionConfirmations(
            this.api.getBlockTime(),
            transactionStruct.id,
            flags.await,
            flags.confirmations,
        );
        this.actionStop();

        return {
            id: flags.unikid,
            transaction: transactionStruct.id,
            confirmations: finalTransaction ? finalTransaction.confirmations : 0,
        };
    }
}
