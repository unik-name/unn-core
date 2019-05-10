import { TransactionTypes } from "../../../constants";
import { feeManager } from "../../../managers";
import { ITransactionData } from "../../../transactions";
import { TransactionBuilder } from "../transaction";

export abstract class NFTBuilder extends TransactionBuilder<NFTBuilder> {
    constructor(type: TransactionTypes, tokenId: string) {
        super();

        this.data.amount = 0;
        this.data.senderPublicKey = null;

        this.data.type = type;
        this.data.fee = feeManager.get(type);

        this.data.asset = {
            nft: {
                tokenId,
            },
        };
    }

    public getStruct(): ITransactionData {
        const struct = super.getStruct();
        struct.recipientId = this.data.recipientId;
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected abstract instance();
}
