import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { getNftTransactionFees, NftTransactionType, NftTransactionGroup } from "../enums";
import { getNftNameFromConfig } from "../utils";

export abstract class NFTBuilder<T extends NFTBuilder<T>> extends Transactions.TransactionBuilder<NFTBuilder<T>> {
    constructor(tokenId: string) {
        super();

        this.data.amount = Utils.BigNumber.ZERO;
        this.data.senderPublicKey = undefined;

        this.data.type = this.type();
        this.data.typeGroup = NftTransactionGroup;
        this.data.fee = Utils.BigNumber.make(getNftTransactionFees(this.data.type));

        this.data.asset = {
            nft: {
                [getNftNameFromConfig()]: {
                    tokenId,
                },
            },
        };
    }

   public getStruct(): Interfaces.ITransactionData {
        const struct = super.getStruct();
        struct.recipientId = this.data.recipientId;
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected abstract type(): NftTransactionType;
}
