import { Transactions } from "@uns/core-nft-crypto";
import { AbstractPayloadSigner } from ".";
import { INftDemand } from "../interfaces";
import { CertifiedNftTransaction } from "../transactions/certified-nft-transaction";

export class NftDemandSigner extends AbstractPayloadSigner<INftDemand> {
    public serialize(): ByteBuffer {
        const buffer: ByteBuffer = Transactions.AbstractNftWithPropertiesTransaction.serializeNftWithProperties(
            this.payload,
        );
        buffer.append(
            CertifiedNftTransaction.serializeDemandPayload(this.payload.demand)
                .flip()
                .toBuffer(),
        );
        return buffer;
    }
}
