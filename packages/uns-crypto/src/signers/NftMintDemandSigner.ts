import { INftMintDemand } from "../interfaces";
import { CertifiedNftMintTransaction } from "../transactions/uns-certified-mint/uns-certified-mint";
import { AbstractPayloadSigner } from "./signers";

export class NftMintDemandSigner extends AbstractPayloadSigner<INftMintDemand> {
    public serialize(): ByteBuffer {
        return CertifiedNftMintTransaction.serializeDemandPayload(this.payload);
    }
}
