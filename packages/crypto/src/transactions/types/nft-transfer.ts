import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
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
        buffer.append(
            Buffer.from(data.asset.nft.tokenId)
                .toString("hex")
                .padStart(32, "0"),
            "hex",
        );
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
                tokenId: Buffer.from(
                    buf
                        .readBytes(16)
                        .toString("hex")
                        .replace(/^0+|\[^0\]+$/g, ""),
                    "hex",
                ),
            },
        };
        data.recipientId = buf.readUint8() ? bs58check.encode(buf.readBytes(21).toBuffer()) : undefined;
    }
}
