import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftUpdateBuilder } from "./nft-update";

export class NftMintBuilder extends NftUpdateBuilder {
    protected type() {
        return NftTransactionType.NftMint;
    }

    protected instance(): NftMintBuilder {
        return this;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftMint);
    }
}
