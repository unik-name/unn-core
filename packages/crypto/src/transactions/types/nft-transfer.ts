import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { configManager } from "../../managers";
import { getCurrentNftAsset } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class NFTTransferTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.NftTransfer;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.nftTransfer;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const bufferSize = 32 + 1 + 21;
        const buffer = new ByteBuffer(bufferSize, true);
        buffer.append(Buffer.from(getCurrentNftAsset(data).tokenId.padStart(64, "0"), "hex"));
        buffer.append(bs58check.decode(data.recipientId));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {
            nft: {
                [configManager.getCurrentNftName()]: {
                    tokenId: buf.readBytes(32).toString("hex"),
                },
            },
        };
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }
}
