import { DiscloseDemandCertificationPayload, DiscloseDemandPayload, PayloadSerializer } from "../transactions";
import { crypto } from "./crypto";
import { HashAlgorithms } from "./hash-algorithms";

class UnsCrypto {
    public signPayload(payload: any, passphrase: string): string {
        return crypto.signHash(this.getPayloadHashBuffer(payload), crypto.getKeys(passphrase));
    }

    public getPayloadHashBuffer(payload: DiscloseDemandPayload | DiscloseDemandCertificationPayload): Buffer {
        return HashAlgorithms.sha256(PayloadSerializer.getBytes(payload));
    }

    /**
     * Verify payload signature.
     */
    public verifyPayload(
        payload: any | DiscloseDemandPayload | DiscloseDemandCertificationPayload,
        signature: Buffer | string,
        publicKey: string,
    ): boolean {
        return crypto.verifyHash(this.getPayloadHashBuffer(payload), signature, publicKey);
    }

    public verifyIssuerCredentials(issuerId) {
        // TODO
        return true;
    }
}

export const unsCrypto = new UnsCrypto();
