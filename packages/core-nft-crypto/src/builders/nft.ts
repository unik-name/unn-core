import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { NftTransactionGroup, NftTransactionType } from "../enums";

export abstract class NftBuilder<T extends NftBuilder<T>> extends Transactions.TransactionBuilder<NftBuilder<T>> {
    constructor(protected nftName: string, tokenId: string) {
        super();

        this.data.amount = Utils.BigNumber.ZERO;
        this.data.senderPublicKey = undefined;

        this.data.type = this.type();
        this.data.typeGroup = NftTransactionGroup;
        this.data.fee = this.fees();

        this.data.asset = {
            nft: {
                [nftName]: {
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
    protected abstract fees(): Utils.BigNumber;
}
