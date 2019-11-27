import { State } from "@arkecosystem/core-interfaces";
import { Handlers } from "@arkecosystem/core-transactions";
import { Interfaces as CryptoInterfaces } from "@arkecosystem/crypto";
import { NftPropertyTooLongError } from "../../errors";

export abstract class NftTransactionHandler extends Handlers.TransactionHandler {
    public async isActivated(): Promise<boolean> {
        return true;
    }

    public async throwIfCannotBeApplied(
        transaction: CryptoInterfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async applyToRecipient(
        transaction: CryptoInterfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line: no-empty
    ): Promise<void> {}

    public async revertForRecipient(
        transaction: CryptoInterfaces.ITransaction,
        walletManager: State.IWalletManager,
        // tslint:disable-next-line:no-empty
    ): Promise<void> {}

    protected checkAssetPropertiesSize(properties) {
        for (const propertyKey in properties) {
            if (properties.hasOwnProperty(propertyKey)) {
                const value = properties[propertyKey];
                if (value && Buffer.from(value, "utf8").length > 255) {
                    throw new NftPropertyTooLongError(propertyKey);
                }
            }
        }
    }
}
