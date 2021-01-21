import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftBuilder } from "./nft";

export class NftMintBuilder extends NftBuilder {
    protected instance(): this {
        return this;
    }

    protected type(): number {
        return NftTransactionType.NftMint;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftMint);
    }
}
