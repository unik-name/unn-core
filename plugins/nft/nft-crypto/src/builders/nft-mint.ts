import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftWithPropertiesBuilder } from "./abstract-nft";

export class NftMintBuilder extends AbstractNftWithPropertiesBuilder<NftMintBuilder> {
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
