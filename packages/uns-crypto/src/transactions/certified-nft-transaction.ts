import { Identities } from "@arkecosystem/crypto";
import { Interfaces } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import {
    ICertificationable,
    ICertifiedDemand,
    INftMintDemandCertification,
    INftMintDemandCertificationPayload,
    INftMintDemandPayload,
} from "../interfaces";

interface ICertifiedTransactionPayloadSerializable {
    serializePayload(payload: any): ByteBuffer;
    deserializePayload(buf: ByteBuffer): void;
}

export abstract class CertifiedNftTransaction implements ICertifiedTransactionPayloadSerializable {
    public static serializeCertificationPayload(payload: ICertificationable): ByteBuffer {
        const payloadBufferSize: number = 32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/;
        const buffer = new ByteBuffer(payloadBufferSize, true);
        buffer.append(payload.sub, "hex");
        buffer.append(payload.iss, "hex");
        buffer.writeUint64(payload.iat);
        return buffer;
    }

    public static serializeDemandPayload(demand: ICertifiedDemand<INftMintDemandPayload>): ByteBuffer {
        const cryptoAccountBuffer: Buffer = Identities.Address.toBuffer(demand.payload.cryptoAccountAddress)
            .addressBuffer;
        const signatureBuffer: Buffer = Buffer.from(demand.signature, "hex");

        const bufferSize: number =
            32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/ + cryptoAccountBuffer.length + signatureBuffer.length;

        const bb: ByteBuffer = new ByteBuffer(bufferSize, true);

        // Payload
        bb.append(demand.payload.iss, "hex");
        bb.append(demand.payload.sub, "hex");
        bb.writeUint64(demand.payload.iat);
        bb.append(cryptoAccountBuffer);

        // Signature
        bb.append(signatureBuffer);

        return bb;
    }
    public abstract data: Interfaces.ITransactionData;
    public abstract serializePayload(payload: any): ByteBuffer;
    public abstract deserializePayload(buf: ByteBuffer): void;

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer: ByteBuffer = this.serializePayload(data.asset);
        buffer.append(
            CertifiedNftTransaction.serializeDemandPayload(data.asset.demand)
                .flip()
                .toBuffer(),
        );
        const certification: INftMintDemandCertification = data.asset.certification;
        const certificationPayload: INftMintDemandCertificationPayload = certification.payload;

        const certificationPayloadBuffer: ByteBuffer = CertifiedNftTransaction.serializeCertificationPayload(
            certificationPayload,
        );

        // buffer.append(certificationPayloadBuffer.buffer);
        buffer.append(certificationPayloadBuffer.flip().toBuffer());

        buffer.append(certification.signature, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        this.deserializePayload(buf);
        this.deserializeDemand(buf);
        this.deserializeCertification(buf);
    }

    protected deserializeDemand(buf: ByteBuffer): void {
        const { data } = this;

        data.asset.demand = {
            payload: {},
        };

        // Demand payload
        data.asset.demand.payload.iss = buf.readBytes(32).toString("hex");
        data.asset.demand.payload.sub = buf.readBytes(32).toString("hex");
        const aaa = buf.readUint64();
        data.asset.demand.payload.iat = aaa.toNumber();
        data.asset.demand.payload.cryptoAccountAddress = Identities.Address.fromBuffer(buf.readBytes(21).toBuffer());

        // Demand signature
        const signatureLength: number = this.getSignatureLength(buf);
        data.asset.demand.signature = buf.readBytes(signatureLength).toString("hex");
    }

    protected deserializeCertification(buf: ByteBuffer): void {
        const { data } = this;

        data.asset.certification = { payload: {} };

        // Certification payload
        data.asset.certification.payload.sub = buf.readBytes(32).toString("hex");
        data.asset.certification.payload.iss = buf.readBytes(32).toString("hex");
        data.asset.certification.payload.iat = buf.readUint64().toNumber();

        const signatureLength: number = this.getSignatureLength(buf);

        // Certification signature
        data.asset.certification.signature = buf.readBytes(signatureLength).toString("hex");
    }

    private getSignatureLength(buf): number {
        buf.mark();

        const lengthHex: string = buf
            .skip(1)
            .readBytes(1)
            .toString("hex");

        buf.reset();
        return parseInt(lengthHex, 16) + 2;
    }
}

export const unsCertifiedBaseTransactionSchema = {
    asset: {
        required: ["certification", "demand"],
        properties: {
            certification: {
                type: "object",
                required: ["payload", "signature"],
                properties: {
                    payload: {
                        type: "object",
                        required: ["iss", "sub", "iat"],
                    },
                    signature: { $ref: "hex" },
                },
            },
            demand: {
                type: "object",
                required: ["payload", "signature"],
                properties: {
                    payload: {
                        type: "object",
                        required: ["iss", "sub", "iat", "cryptoAccountAddress"],
                    },
                    signature: { $ref: "hex" },
                },
            },
        },
    },
};
