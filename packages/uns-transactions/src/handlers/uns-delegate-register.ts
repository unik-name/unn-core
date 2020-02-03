import { State } from "@arkecosystem/core-interfaces";
import { TransactionHandlerConstructor } from "@arkecosystem/core-transactions/dist/handlers";
import { DelegateRegistrationTransactionHandler } from "@arkecosystem/core-transactions/dist/handlers/delegate-registration";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler, NftOwnerError } from "@uns/core-nft";
import { DelegateRegisterTransaction, DIDHelpers, DIDTypes } from "@uns/crypto";
import { CryptoAccountHasSeveralUniksError, InvalidUnikTypeError, UnikNameNotDisclosedError } from "../errors";
import { EXPLICIT_PROP_KEY, getNftsManager } from "./utils/helpers";

export const DELEGATE_BADGE = "Badges/NP/Delegate";
export class DelegateRegisterTransactionHandler extends DelegateRegistrationTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return DelegateRegisterTransaction;
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [DelegateRegistrationTransactionHandler, NftMintTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const nftId: string = transaction.data.asset.delegate.username;

        // check token ownership
        if (wallet.hasAttribute("tokens") && !wallet.getAttribute("tokens").tokens.includes(nftId)) {
            throw new NftOwnerError(wallet.address, nftId);
        }

        // assert wallet has only 1 Unik
        if (wallet.getAttribute("tokens").tokens.length > 1) {
            throw new CryptoAccountHasSeveralUniksError();
        }

        const properties = await getNftsManager().getProperties(nftId);

        // check disclose status of unikname
        if (!properties.find(elt => elt.key === EXPLICIT_PROP_KEY)?.value.length) {
            throw new UnikNameNotDisclosedError(nftId);
        }

        // check UNIK Type
        const nftType = parseInt(properties.find(elt => elt.key === "type").value);

        if (!(nftType === DIDTypes.INDIVIDUAL || nftType === DIDTypes.ORGANIZATION)) {
            throw new InvalidUnikTypeError(DIDHelpers.fromCode(nftType));
        }

        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }

    public async applyToSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.applyToSender(transaction, walletManager);
        if (updateDb) {
            const nftId: string = transaction.data.asset.delegate.username;
            await getNftsManager().manageProperties({ [DELEGATE_BADGE]: "true" }, nftId);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);
        if (updateDb) {
            const nftId: string = transaction.data.asset.delegate.username;
            await getNftsManager().deleteProperty(DELEGATE_BADGE, nftId);
        }
    }
}
