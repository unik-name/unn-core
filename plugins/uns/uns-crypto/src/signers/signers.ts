import { Crypto, Identities } from "@arkecosystem/crypto";

/**
 * Provide all features to sign and verify payloads.
 */
export interface IPayloadSigner {
    /**
     * Get the signature of a payload as a string
     *
     * @param payload The payload to sign
     * @param passphrase The passphrase to use to sign the payload
     */
    sign(passphrase: string): string;

    /**
     * Verify the signature a designated payload
     *
     * @param payload The payload we want to verify the signature
     * @param signature The signature to check
     * @param publicKey The public to check the signature emitter
     */
    verify(signature: Buffer | string, publicKey: string): boolean;
}

export abstract class AbstractPayloadSigner<T> implements IPayloadSigner {
    constructor(protected payload: T) {}

    public sign(passphrase: string): string {
        return Crypto.Hash.signECDSA(this.getPayloadHashBuffer(), Identities.Keys.fromPassphrase(passphrase));
    }

    public verify(signature: Buffer | string, publicKey: string): boolean {
        return Crypto.Hash.verifyECDSA(this.getPayloadHashBuffer(), signature, publicKey);
    }

    public abstract serialize(): ByteBuffer;

    private getPayloadHashBuffer(): Buffer {
        let bb = this.serialize();
        // Need to flip it, otherwise buffer creation will result in an empty Buffer
        bb = bb.flip();
        return Crypto.HashAlgorithms.sha256(bb.toBuffer());
    }
}

/**
 * Provide all features to compute payload hash buffer.
 */
export interface IPayloadHashBuffer {
    /**
     * Function to compute payload hash buffer to an hex string.
     */
    getPayloadHashBuffer(): string;
}
