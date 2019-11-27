import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import Long from "long";
import { unsTransactionGroup, UnsTransactionStaticFees, UnsTransactionType } from "../../enums";
import { IDiscloseDemand, IDiscloseDemandCertification } from "../../interfaces";
import { unsDiscloseDemand } from "./schema";

export class DiscloseExplicitTransaction extends Transactions.Transaction {
    public static typeGroup: number = unsTransactionGroup;
    public static type: number = UnsTransactionType.UnsDiscloseExplicit;
    public static key: string = "UnsDiscloseExplicit";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return Transactions.schemas.extend(Transactions.schemas.transactionBaseSchema, {
            $id: "unsDiscloseExplicit",
            required: ["asset"],
            properties: {
                type: { transactionType: UnsTransactionType.UnsDiscloseExplicit },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                ...unsDiscloseDemand,
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        UnsTransactionStaticFees.UnsDiscloseExplicit,
    );

    public serialize(): ByteBuffer {
        const { data } = this;
        const discloseDemand: IDiscloseDemand = data.asset["disclose-demand"];
        const discloseDemandCert: IDiscloseDemandCertification = data.asset["disclose-demand-certification"];

        const bufferSize =
            1 +
            discloseDemand.payload.explicitValue.length +
            this.computeExplicitValuesSize(discloseDemand.payload.explicitValue) +
            1 /*type*/ +
            32 /*iss*/ +
            32 /*sub*/ +
            8 /*iat*/ +
            Buffer.from(discloseDemand.signature, "hex").length +
            32 /*iss*/ +
            32 /*sub*/ +
            8 /*iat*/ +
            Buffer.from(discloseDemandCert.signature, "hex").length;
        const buffer = new ByteBuffer(bufferSize, true);
        buffer.writeUint8(discloseDemand.payload.explicitValue.length);

        for (const explicitValue of discloseDemand.payload.explicitValue) {
            const explicitValueBuf = Buffer.from(explicitValue, "utf8");
            buffer.writeUint8(explicitValueBuf.length);
            buffer.append(explicitValueBuf, "utf8");
        }

        buffer.writeUint8(discloseDemand.payload.type);
        buffer.append(discloseDemand.payload.iss, "hex");
        buffer.append(discloseDemand.payload.sub, "hex");
        buffer.writeUint64(Long.fromValue(discloseDemand.payload.iat));
        buffer.append(discloseDemand.signature, "hex");

        buffer.append(discloseDemandCert.payload.sub, "hex");
        buffer.append(discloseDemandCert.payload.iss, "hex");
        buffer.writeUint64(Long.fromValue(discloseDemandCert.payload.iat));
        buffer.append(discloseDemandCert.signature, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {
            "disclose-demand": {
                payload: {},
                signature: {},
            } as IDiscloseDemand,
            "disclose-demand-certification": {
                payload: {},
                signature: {},
            } as IDiscloseDemandCertification,
        };
        const discloseDemand: IDiscloseDemand = data.asset["disclose-demand"];
        const discloseDemandCert: IDiscloseDemandCertification = data.asset["disclose-demand-certification"];

        const explicitValuesLength = buf.readUint8();

        const explicitValues: string[] = [];
        for (let i = 0; i < explicitValuesLength; i++) {
            const expValLength = buf.readUint8();
            const value = buf.readBytes(expValLength).toUTF8();
            explicitValues.push(value);
        }
        discloseDemand.payload.explicitValue = explicitValues;
        discloseDemand.payload.type = buf.readUint8();
        discloseDemand.payload.iss = buf.readBytes(32).toString("hex");
        discloseDemand.payload.sub = buf.readBytes(32).toString("hex");
        discloseDemand.payload.iat = buf.readUint64().toNumber();
        let signatureLength = this.getSignatureLength(buf);
        discloseDemand.signature = buf.readBytes(signatureLength).toString("hex");
        discloseDemandCert.payload.sub = buf.readBytes(32).toString("hex");
        discloseDemandCert.payload.iss = buf.readBytes(32).toString("hex");
        discloseDemandCert.payload.iat = buf.readUint64().toNumber();
        signatureLength = this.getSignatureLength(buf);
        discloseDemandCert.signature = buf.readBytes(signatureLength).toString("hex");
    }

    private computeExplicitValuesSize(explicitValues: string[]): number {
        let size = 0;
        for (const explicitValue of explicitValues) {
            size += Buffer.from(explicitValue, "utf8").length;
        }
        return size;
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
