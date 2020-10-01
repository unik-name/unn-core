import { State } from "@arkecosystem/core-interfaces";
import { TransactionHandlerConstructor } from "@arkecosystem/core-transactions/dist/handlers";
import { VoteTransactionHandler } from "@arkecosystem/core-transactions/dist/handlers/vote";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler } from "@uns/core-nft";
import { INftWalletAttributes } from "@uns/core-nft/dist/interfaces";
import { DIDTypes, VoteTransaction } from "@uns/crypto";
import { NoUnikError, VoteUnikTypeError } from "../errors";
import { DelegateRegisterTransactionHandler } from "./uns-delegate-register";

export class UnsVoteTransactionHandler extends VoteTransactionHandler {
    public getConstructor(): Transactions.TransactionConstructor {
        return VoteTransaction;
    }

    public async isActivated(): Promise<boolean> {
        return true;
    }

    public dependencies(): ReadonlyArray<TransactionHandlerConstructor> {
        return [VoteTransactionHandler, NftMintTransactionHandler, DelegateRegisterTransactionHandler];
    }

    public walletAttributes(): ReadonlyArray<string> {
        return [];
    }

    public async throwIfCannotBeApplied(
        transaction: Interfaces.ITransaction,
        wallet: State.IWallet,
        walletManager: State.IWalletManager,
    ): Promise<void> {
        // check sender token type
        if (!(wallet.hasAttribute("tokens") && Object.keys(wallet.getAttribute("tokens")).length)) {
            throw new NoUnikError(transaction.id);
        }

        // get sender token type
        const tokens: INftWalletAttributes = wallet.getAttribute("tokens");
        const nftId = Object.keys(tokens)[0];
        const type: DIDTypes = tokens[nftId].type;

        // get delegate unik type
        const vote: string = transaction.data.asset.votes[0];
        const delegatePublicKey: string = vote.slice(1);
        const delegateWallet: State.IWallet = walletManager.findByPublicKey(delegatePublicKey);
        const delegateType = delegateWallet.getAttribute<DIDTypes>("delegate.type");
        // check unik types
        if (type !== delegateType) {
            throw new VoteUnikTypeError(transaction.id);
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
}
