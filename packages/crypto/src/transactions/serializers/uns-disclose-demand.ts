import ByteBuffer from "bytebuffer";
import { Bignum } from "../../utils";
import { DiscloseDemandCertificationPayload, DiscloseDemandPayload } from "../uns-interfaces";

export class PayloadSerializer {
    public static getBytes(payload: DiscloseDemandPayload | DiscloseDemandCertificationPayload): Buffer {
        let buf;
        // check payload type
        if ("explicitValue" in payload) {
            const explicitValueLength = Buffer.from(payload.explicitValue.join(""), "utf8").length;
            buf = new ByteBuffer(explicitValueLength + 1 /*type*/ + 32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/, true);
            buf.append(payload.explicitValue.join(""), "utf8");
            buf.writeUint8(payload.type);
            buf.append(payload.iss, "hex");
            buf.append(payload.sub, "hex");
            buf.writeUint64(+new Bignum(payload.iat));
        } else {
            buf = new ByteBuffer(32 /*iss*/ + 32 /*sub*/ + 8 /*iat*/, true);
            buf.append(payload.iss, "hex");
            buf.append(payload.sub, "hex");
            buf.writeUint64(+new Bignum(payload.iat));
        }

        return buf.flip().toBuffer();
    }
}
