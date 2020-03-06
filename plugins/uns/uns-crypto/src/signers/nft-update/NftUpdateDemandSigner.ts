import { Transactions } from "@uns/core-nft-crypto";
import { INftUpdateDemand } from "../../interfaces";
import { CertifiedNftTransaction } from "../../transactions/certified-nft-transaction";
import { AbstractPayloadSigner } from "../signers";

export class NftUpdateDemandSigner extends AbstractPayloadSigner<INftUpdateDemand> {
    public serialize(): ByteBuffer {
        const buffer: ByteBuffer = Transactions.NftUpdateTransaction.serializeNftWithProperties(this.payload);
        buffer.append(
            CertifiedNftTransaction.serializeDemandPayload(this.payload.demand)
                .flip()
                .toBuffer(),
        );
        return buffer;
    }
}
