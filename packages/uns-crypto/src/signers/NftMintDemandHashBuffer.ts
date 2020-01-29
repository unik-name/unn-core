import { Crypto } from "@arkecosystem/crypto";
import { INftMintDemand } from "../interfaces";
import { CertifiedNftMintTransaction } from "../transactions";
import { IPayloadHashBuffer } from "./signers";

export class NftMintDemandHashBuffer implements IPayloadHashBuffer {
    constructor(private payload: INftMintDemand) {}

    public getPayloadHashBuffer(): string {
        let bb = CertifiedNftMintTransaction.serializeDemandPayload(this.payload);
        // Need to flip it, otherwise buffer creation will result in an empty Buffer
        bb = bb.flip();
        return Crypto.HashAlgorithms.sha256(bb.toBuffer()).toString("hex");
    }
}
