import { State } from "@arkecosystem/core-interfaces";
import { TransactionHandlerConstructor } from "@arkecosystem/core-transactions/dist/handlers";
import { VoteTransactionHandler } from "@arkecosystem/core-transactions/dist/handlers/vote";
import { Interfaces, Transactions } from "@arkecosystem/crypto";
import { NftMintTransactionHandler } from "@uns/core-nft";
import { VoteTransaction } from "@uns/crypto";
import { NoUnikError, VoteUnikTypeError } from "../errors";
import { DelegateRegisterTransactionHandler } from "./uns-delegate-register";
import { getNftsManager } from "./utils/helpers";

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
        if (!(wallet.hasAttribute("tokens") && wallet.getAttribute("tokens").tokens.length)) {
            throw new NoUnikError(transaction.id);
        }

        // get sender token type
        const nftId = wallet.getAttribute("tokens").tokens[0];
        const type: string = (await getNftsManager().getProperty(nftId, "type")).value;

        // get delegate unik type
        const vote: string = transaction.data.asset.votes[0];
        const delegatePublicKey: string = vote.slice(1);
        const delegateWallet: State.IWallet = walletManager.findByPublicKey(delegatePublicKey);
        const delegateType = delegateWallet.getAttribute<number>("delegate.type");
        // check unik types
        if (parseInt(type) !== delegateType) {
            throw new VoteUnikTypeError(transaction.id);
        }
        return super.throwIfCannotBeApplied(transaction, wallet, walletManager);
    }
}
