import { INftMintDemandCertificationPayload } from "../../interfaces";
import { CertifiedNftTransaction } from "../../transactions/certified-nft-transaction";
import { AbstractPayloadSigner } from "../signers";

export class NftMintDemandCertificationSigner extends AbstractPayloadSigner<INftMintDemandCertificationPayload> {
    public serialize(): ByteBuffer {
        return CertifiedNftTransaction.serializeCertificationPayload(this.payload);
    }
}
