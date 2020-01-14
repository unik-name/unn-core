import { Transactions, Utils } from "@arkecosystem/crypto";
import { Transactions as NftTransactions } from "@uns/core-nft-crypto";
import ByteBuffer from "bytebuffer";
import { UnsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../../enums";
import { INftMintDemandCertification, INftMintDemandCertificationPayload } from "../../interfaces";
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

    public static serializePayload(payload: ICertificationable): ByteBuffer {
        const payloadBufferSize: number = 32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/;
        const buffer = new ByteBuffer(payloadBufferSize, true);
        buffer.append(payload.sub, "hex");
        buffer.append(payload.iss, "hex");
        buffer.writeUint64(payload.iat);
        return buffer;
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsCertifiedNftMint,
    );

    public serialize(): ByteBuffer {
        // NftUpdate serialize
        const buffer: ByteBuffer = super.serialize();
        const { data } = this;
        const certification: INftMintDemandCertification = data.asset.certification;
        const certificationPayload: INftMintDemandCertificationPayload = certification.payload;

        const certificationPayloadBuffer: ByteBuffer = CertifiedNftMintTransaction.serializePayload(
            certificationPayload,
        );

        buffer.append(certificationPayloadBuffer.buffer);

        buffer.append(certification.signature, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        super.deserialize(buf);

        const { data } = this;

        data.asset.certification = { payload: {} };

        data.asset.certification.payload.sub = buf.readBytes(32).toString("hex");
        data.asset.certification.payload.iss = buf.readBytes(32).toString("hex");
        data.asset.certification.payload.iat = buf.readUint64().toNumber();

        const signatureLength: number = this.getSignatureLength(buf);

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
