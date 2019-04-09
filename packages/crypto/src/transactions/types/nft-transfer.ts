import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { Bignum } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class NFTTransferTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.NftTransfer;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.nftTransfer;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const bufferSize = data.recipientId ? 54 : 33;
        const buffer = new ByteBuffer(bufferSize, true);

        buffer.append(new Bignum(data.asset.nft.tokenId).toString(16).padStart(32, "0"), "hex");
        buffer.writeByte(data.recipientId ? 0x01 : 0x00);
        if (data.recipientId) {
            buffer.append(bs58check.decode(data.recipientId));
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {
            nft: {
                tokenId: new Bignum(buf.readBytes(16).toHex(), 16),
            },
            recipientId: buf.readUint8() ? bs58check.encode(buf.readBytes(21).toBuffer()) : undefined,
        };
    }
}
