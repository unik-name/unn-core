import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftUpdateBuilder } from "./nft-update";

export class NftMintBuilder extends NftUpdateBuilder {
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
