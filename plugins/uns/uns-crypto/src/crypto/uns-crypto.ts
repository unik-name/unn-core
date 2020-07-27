import { Crypto, Identities, Managers } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { IDiscloseDemandCertificationPayload, IDiscloseDemandPayload } from "../";

class UnsCrypto {
    public signPayload(payload: any, passphrase: string): string {
        return Crypto.Hash.signECDSA(this.getPayloadHashBuffer(payload), Identities.Keys.fromPassphrase(passphrase));
    }

    public getPayloadHashBuffer(payload: IDiscloseDemandPayload | IDiscloseDemandCertificationPayload): Buffer {
        return Crypto.HashAlgorithms.sha256(this.serializeDiscloseDemand(payload));
    }

    /**
     * Verify payload signature.
     */
    public verifyPayload(
        payload: any | IDiscloseDemandPayload | IDiscloseDemandCertificationPayload,
        signature: Buffer | string,
        publicKey: string,
    ): boolean {
        return Crypto.Hash.verifyECDSA(this.getPayloadHashBuffer(payload), signature, publicKey);
    }

    /**
     * Return false if the issuer is not allowed to
     */
    public verifyIssuerCredentials(issuerId: string): boolean {
        const nftFactoryList: string[] = Managers.configManager.get("network.forgeFactory.unikidWhiteList");
        const urlCheckerList: string[] = Managers.configManager.get("network.urlCheckers") || [];
        return nftFactoryList.concat(urlCheckerList).includes(issuerId);
    }

    public serializeDiscloseDemand(payload: IDiscloseDemandPayload | IDiscloseDemandCertificationPayload): Buffer {
        let buf;
        // check payload type
        if ("explicitValue" in payload) {
            const explicitValueLength = Buffer.from(payload.explicitValue.join(""), "utf8").length;
            buf = new ByteBuffer(explicitValueLength + 1 /*type*/ + 32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/, true);
            buf.append(payload.explicitValue.join(""), "utf8");
            buf.writeUint8(payload.type);
            buf.append(payload.iss, "hex");
            buf.append(payload.sub, "hex");
            buf.writeUint64(payload.iat);
        } else {
            buf = new ByteBuffer(32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/, true);
            buf.append(payload.iss, "hex");
            buf.append(payload.sub, "hex");
            buf.writeUint64(payload.iat);
        }

        return buf.flip().toBuffer();
    }
}

export const unsCrypto = new UnsCrypto();
