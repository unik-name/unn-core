import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { Bignum } from "../../utils";
import { NFTTransferTransaction } from "./nft-transfer";
import * as schemas from "./schemas";

export class NFTMintTransaction extends NFTTransferTransaction {
    public static type: TransactionTypes = TransactionTypes.NftMint;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.nftTransfer;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = super.serialize();

        buffer.writeUint32(data.asset.payments.length);
        data.asset.payments.forEach(p => {
            buffer.append(p.actorType);
            buffer.append(bs58check.decode(p.publicKey));
        });

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        super.deserialize(buf);
        const { data } = this;

        const payments = [];
        const total = buf.readUint32();

        for (let j = 0; j < total; j++) {
            payments.push({
                actorType: new Bignum(buf.readUint64().toString()),
                publicKey: bs58check.encode(buf.readBytes(21).toBuffer()),
            });
        }

        data.amount = payments.reduce((a, p) => a.plus(p.amount), Bignum.ZERO);
    }
}
