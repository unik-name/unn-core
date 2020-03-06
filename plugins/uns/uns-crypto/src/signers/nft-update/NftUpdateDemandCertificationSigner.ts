import { INftUpdateDemandCertificationPayload } from "../../interfaces";
import { CertifiedNftTransaction } from "../../transactions/certified-nft-transaction";
import { AbstractPayloadSigner } from "../signers";

export class NftUpdateDemandCertificationSigner extends AbstractPayloadSigner<INftUpdateDemandCertificationPayload> {
    public serialize(): ByteBuffer {
        return CertifiedNftTransaction.serializeCertificationPayload(this.payload);
    }
}
