import { INftMintDemandCertificationPayload } from "../interfaces";
import { CertifiedNftMintTransaction } from "../transactions/uns-certified-mint/uns-certified-mint";
import { AbstractPayloadSigner } from "./signers";

export class NftMintDemandCertificationSigner extends AbstractPayloadSigner<INftMintDemandCertificationPayload> {
    public serialize(): ByteBuffer {
        return CertifiedNftMintTransaction.serializeCertificationPayload(this.payload);
    }
}
