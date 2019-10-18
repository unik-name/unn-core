import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { Bignum } from "../../utils";
import { getSignatureLength } from "../deserializers/transaction";
import { DiscloseDemand, DiscloseDemandCertification } from "../uns-interfaces";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class DiscloseExplicitTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.UnsDiscloseExplicit;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.discloseExplicit;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const discloseDemand = data.asset["disclose-demand"];
        const discloseDemandCert = data.asset["disclose-demand-certification"];

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
        buffer.writeUint64(+new Bignum(discloseDemand.payload.iat));
        buffer.append(discloseDemand.signature, "hex");

        buffer.append(discloseDemandCert.payload.sub, "hex");
        buffer.append(discloseDemandCert.payload.iss, "hex");
        buffer.writeUint64(+new Bignum(discloseDemandCert.payload.iat));
        buffer.append(discloseDemandCert.signature, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {
            "disclose-demand": {
                payload: {},
                signature: {},
            } as DiscloseDemand,
            "disclose-demand-certification": {
                payload: {},
                signature: {},
            } as DiscloseDemandCertification,
        };
        const discloseDemand: DiscloseDemand = data.asset["disclose-demand"];
        const discloseDemandCert: DiscloseDemandCertification = data.asset["disclose-demand-certification"];

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
        discloseDemand.payload.iat = new Bignum(buf.readUint64().toString()).toNumber();
        let signatureLength = getSignatureLength(buf);
        discloseDemand.signature = buf.readBytes(signatureLength).toString("hex");
        discloseDemandCert.payload.sub = buf.readBytes(32).toString("hex");
        discloseDemandCert.payload.iss = buf.readBytes(32).toString("hex");
        discloseDemandCert.payload.iat = new Bignum(buf.readUint64().toString()).toNumber();
        signatureLength = getSignatureLength(buf);
        discloseDemandCert.signature = buf.readBytes(signatureLength).toString("hex");
    }

    private computeExplicitValuesSize(explicitValues: string[]): number {
        let size = 0;
        for (const explicitValue of explicitValues) {
            size += Buffer.from(explicitValue, "utf8").length;
        }
        return size;
    }
}
