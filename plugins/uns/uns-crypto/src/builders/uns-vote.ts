import { Utils } from "@arkecosystem/crypto";
import { VoteBuilder } from "@arkecosystem/crypto/dist/transactions/builders/transactions/vote";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../enums";

export class UNSVoteBuilder extends VoteBuilder {
    constructor() {
        super();
        this.data.type = UnsTransactionType.UnsVote;
        this.data.typeGroup = UnsTransactionGroup;
        this.data.fee = Utils.BigNumber.make(UnsTransactionStaticFees.UnsVote);
    }

    protected instance(): UNSVoteBuilder {
        return this;
    }
}
