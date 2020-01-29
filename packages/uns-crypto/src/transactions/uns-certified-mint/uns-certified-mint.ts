import { Transactions, Utils } from "@arkecosystem/crypto";
import { Address } from "@arkecosystem/crypto/dist/identities";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import { NftMintTransaction } from "@uns/core-nft-crypto/dist/transactions";
import ByteBuffer from "bytebuffer";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../../enums";
import { INftMintDemand, INftMintDemandCertification, INftMintDemandCertificationPayload } from "../../interfaces";
import { ICertificationable } from "../../interfaces/certification";
import { unsCertifiedMint } from "./schema";

export class CertifiedNftMintTransaction extends NftTransactions.NftMintTransaction {
    public static typeGroup: number = UnsTransactionGroup;
    public static type: number = UnsTransactionType.UnsCertifiedNftMint;
    public static key: string = "UnsCertifiedNftMint";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return Transactions.schemas.extend(NftTransactions.NftMintTransaction.getSchema(), {
            $id: "unsCertifiedNftMint",
            properties: {
                type: { transactionType: UnsTransactionType.UnsCertifiedNftMint },
                typeGroup: { const: UnsTransactionGroup },
                ...unsCertifiedMint,
            },
        });
    }

    public static serializeCertificationPayload(payload: ICertificationable): ByteBuffer {
        const payloadBufferSize: number = 32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/;
        const buffer = new ByteBuffer(payloadBufferSize, true);
        buffer.append(payload.sub, "hex");
        buffer.append(payload.iss, "hex");
        buffer.writeUint64(payload.iat);
        return buffer;
    }

    public static serializeDemandPayload(mintDemand: INftMintDemand): ByteBuffer {
        // Serialize nft part
        const bb: ByteBuffer = NftMintTransaction.serializePayload({ nft: mintDemand.nft });
        // Serialize demand part
        // Payload
        bb.append(mintDemand.demand.payload.iss, "hex");
        bb.append(mintDemand.demand.payload.sub, "hex");
        bb.writeUint64(mintDemand.demand.payload.iat);
        bb.append(Address.toBuffer(mintDemand.demand.payload.cryptoAccountAddress).addressBuffer);

        // Signature
        bb.append(mintDemand.demand.signature, "hex");

        return bb;
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsCertifiedNftMint,
    );

    public serialize(): ByteBuffer {
        // NftUpdate serialize
        const { data } = this;
        const buffer: ByteBuffer = CertifiedNftMintTransaction.serializeDemandPayload({
            nft: data.asset.nft,
            demand: data.asset.demand,
        });
        const certification: INftMintDemandCertification = data.asset.certification;
        const certificationPayload: INftMintDemandCertificationPayload = certification.payload;

        const certificationPayloadBuffer: ByteBuffer = CertifiedNftMintTransaction.serializeCertificationPayload(
            certificationPayload,
        );

        // buffer.append(certificationPayloadBuffer.buffer);
        buffer.append(certificationPayloadBuffer.flip().toBuffer());

        buffer.append(certification.signature, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        this.deserializeDemand(buf);
        this.deserializeCertification(buf);
    }

    private deserializeDemand(buf: ByteBuffer): void {
        // Demand nft part
        super.deserialize(buf);

        const { data } = this;

        data.asset.demand = {
            payload: {},
        };

        // Demand payload
        data.asset.demand.payload.iss = buf.readBytes(32).toString("hex");
        data.asset.demand.payload.sub = buf.readBytes(32).toString("hex");
        data.asset.demand.payload.iat = buf.readUint64().toNumber();
        data.asset.demand.payload.cryptoAccountAddress = Address.fromBuffer(buf.readBytes(21).toBuffer());

        // Demand signature
        const signatureLength: number = this.getSignatureLength(buf);
        data.asset.demand.signature = buf.readBytes(signatureLength).toString("hex");
    }

    private deserializeCertification(buf: ByteBuffer): void {
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
