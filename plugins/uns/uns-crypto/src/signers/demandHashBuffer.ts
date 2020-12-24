import { Crypto } from "@arkecosystem/crypto";
import { Transactions } from "@uns/core-nft-crypto";
import { IPayloadHashBuffer } from ".";
import { INftDemand } from "../interfaces";
import { CertifiedNftTransaction } from "../transactions/certified-nft-transaction";

export class NftDemandHashBuffer implements IPayloadHashBuffer {
    constructor(private payload: INftDemand) {}

    public getPayloadHashBuffer(): string {
        let bb = Transactions.AbstractNftWithPropertiesTransaction.serializeNftWithProperties(this.payload);
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
