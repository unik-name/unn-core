import { Transactions } from "@uns/core-nft-crypto";
import { INftMintDemand } from "../../interfaces";
import { CertifiedNftTransaction } from "../../transactions/certified-nft-transaction";
import { AbstractPayloadSigner } from "../signers";

export class NftMintDemandSigner extends AbstractPayloadSigner<INftMintDemand> {
    public serialize(): ByteBuffer {
        const buffer: ByteBuffer = Transactions.NftMintTransaction.serializeNftWithProperties(this.payload);
        buffer.append(
            CertifiedNftTransaction.serializeDemandPayload(this.payload.demand)
                .flip()
                .toBuffer(),
        );
        return buffer;
    }
}
