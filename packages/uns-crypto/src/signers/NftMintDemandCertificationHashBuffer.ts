import { Crypto } from "@arkecosystem/crypto";
import { Transactions } from "@uns/core-nft-crypto";
import { INftMintDemand } from "../interfaces";
import { IPayloadHashBuffer } from "./signers";

export class NftMintDemandPayloadHashBuffer implements IPayloadHashBuffer {
    constructor(private payload: INftMintDemand) {}

    public getPayloadHashBuffer(): string {
        let bb = Transactions.NftUpdateTransaction.serializePayload(this.payload);
        // Need to flip it, otherwise buffer creation will result in an empty Buffer
        bb = bb.flip();
        return Crypto.HashAlgorithms.sha256(bb.toBuffer()).toString("hex");
    }
}
