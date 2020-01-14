import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { NftTransactionGroup } from "../enums";

export interface IAssetBuilder {
    /**
     * Allow to get the current "asset" of the builder
     */
    getCurrentAsset(): Interfaces.ITransactionAsset;
}

export abstract class NftBuilder<T extends NftBuilder<T>> extends Transactions.TransactionBuilder<NftBuilder<T>>
    implements IAssetBuilder {
    constructor(protected nftName: string, tokenId: string) {
        super();

        this.data.amount = Utils.BigNumber.ZERO;
        this.data.senderPublicKey = undefined;

        this.data.type = this.type();
        this.data.typeGroup = this.getTypeGroup();
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

    public getCurrentAsset(): Interfaces.ITransactionAsset {
        return this.data.asset;
    }
    protected abstract type(): number;
    protected abstract fees(): Utils.BigNumber;

    protected getTypeGroup(): number {
        return NftTransactionGroup;
    }
}
