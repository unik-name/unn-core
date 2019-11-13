import { Utils } from "@arkecosystem/crypto";
import { NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftUpdateBuilder } from "./nft-update";

export class NftMintBuilder extends NftUpdateBuilder {
    protected instance(): NftMintBuilder {
        return this;
    }

    protected type() {
        return NftTransactionType.NftMint;
    }

    protected fees() {
        return Utils.BigNumber.make(NftTransactionStaticFees.NftMint);
    }
}
