import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftBuilder } from "./nft";

export class NftUpdateBuilder extends NftBuilder {
    protected instance(): this {
        return this;
    }

    protected type(): number {
        return NftTransactionType.NftUpdate;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftUpdate);
    }
}
