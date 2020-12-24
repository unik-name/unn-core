import { AbstractPayloadSigner } from ".";
import { INftDemandCertificationPayload } from "../interfaces";
import { CertifiedNftTransaction } from "../transactions/certified-nft-transaction";

export class NftCertificationSigner extends AbstractPayloadSigner<INftDemandCertificationPayload> {
    public serialize(): ByteBuffer {
        return CertifiedNftTransaction.serializeCertificationPayload(this.payload);
    }
}
