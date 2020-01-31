import { Crypto } from "@arkecosystem/crypto";
import { Transactions } from "@uns/core-nft-crypto";
import { INftMintDemand } from "../../interfaces";
import { CertifiedNftTransaction } from "../../transactions/certified-nft-transaction";
import { IPayloadHashBuffer } from "../signers";

export class NftUpdateDemandHashBuffer implements IPayloadHashBuffer {
    constructor(private payload: INftMintDemand) {}

    public getPayloadHashBuffer(): string {
        let bb = Transactions.NftUpdateTransaction.serializeNftWithProperties(this.payload);
        bb.append(
            CertifiedNftTransaction.serializeDemandPayload(this.payload.demand)
                .flip()
                .toBuffer(),
        );
        // Need to flip it, otherwise buffer creation will result in an empty Buffer
        bb = bb.flip();
        return Crypto.HashAlgorithms.sha256(bb.toBuffer()).toString("hex");
    }
}
