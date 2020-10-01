import { Database, State } from "@arkecosystem/core-interfaces";
import { TransactionHandlerConstructor } from "@arkecosystem/core-transactions/dist/handlers";
import { DelegateRegistrationTransactionHandler } from "@arkecosystem/core-transactions/dist/handlers/delegate-registration";
import { Interfaces, Managers, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler, NftOwnerError } from "@uns/core-nft";
import { DelegateRegisterTransaction, DIDHelpers, DIDTypes, isUnikId } from "@uns/crypto";
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
        return ["delegate.type"];
    }

    public async bootstrap(connection: Database.IConnection, walletManager: State.IWalletManager): Promise<void> {
        // Call legacy delegate register bootstrap
        await super.bootstrap(connection, walletManager);

        // Set "delegate.type" attribute for each delegates
        const delegates = walletManager.allByUsername();
        const unsDelegate = delegates.filter(delegate => isUnikId(delegate.getAttribute<string>("delegate.username")));

        for (const delegate of unsDelegate) {
            const tokenId = delegate.getAttribute<string>("delegate.username");
            const nftType: DIDTypes = delegate.getAttribute("tokens")[tokenId].type;
            delegate.setAttribute<number>("delegate.type", nftType);
            walletManager.reindex(delegate);
        }
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        const nftId: string = transaction.data.asset.delegate.username;

        // check token ownership
        if (wallet.hasAttribute("tokens") && !Object.keys(wallet.getAttribute("tokens")).includes(nftId)) {
            throw new NftOwnerError(wallet, nftId);
        }

        // assert wallet has only 1 Unik
        if (Object.keys(wallet.getAttribute("tokens")).length > 1) {
            throw new CryptoAccountHasSeveralUniksError();
        }

        const properties = await getNftsManager().getProperties(nftId);

        // check disclose status of unikname
        if (!properties.find(elt => elt.key === EXPLICIT_PROP_KEY)?.value.length) {
            throw new UnikNameNotDisclosedError(nftId);
        }

        // check UNIK Type
        const nftType = parseInt(properties.find(elt => elt.key === "type").value);

        if (!(nftType === DIDTypes.INDIVIDUAL || nftType === DIDTypes.ORGANIZATION) && !this.isWhitelisted(nftId)) {
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

        const nftId: string = transaction.data.asset.delegate.username;
        const senderWallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        const nftType: DIDTypes = senderWallet.getAttribute("tokens")[nftId].type;

        senderWallet.setAttribute<number>("delegate.type", nftType);

        if (updateDb) {
            await getNftsManager().manageProperties({ [DELEGATE_BADGE]: "true" }, nftId);
        }
    }

    public async revertForSender(
        transaction: Interfaces.ITransaction,
        walletManager: State.IWalletManager,
        updateDb = false,
    ): Promise<void> {
        await super.revertForSender(transaction, walletManager);

        const nftId: string = transaction.data.asset.delegate.username;
        const senderWallet: State.IWallet = walletManager.findByPublicKey(transaction.data.senderPublicKey);
        senderWallet.forgetAttribute("delegate.type");

        if (updateDb) {
            await getNftsManager().deleteProperty(DELEGATE_BADGE, nftId);
        }
    }

    private isWhitelisted(nftId: string): boolean {
        return Managers.configManager.get("network.delegateWhitelistUniks").includes(nftId);
    }
}
