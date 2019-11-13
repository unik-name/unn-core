import { Transactions, Utils } from "@arkecosystem/crypto";
import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "../enums";
import { getCurrentNftAsset, getNftName } from "../utils";
import { NftSchemas } from "./utils";

const { schemas } = Transactions;

export class NftTransferTransaction extends Transactions.Transaction {
    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftTransfer;
    public static key: string = "NftTransfer";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "nftTransfer",
            required: ["asset", "recipientId"],
            properties: {
                type: { transactionType: NftTransactionType.NftTransfer },
                recipientId: { $ref: "address" },
                ...NftSchemas.nft,
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(NftTransactionStaticFees.NftTransfer);

    public serialize(): ByteBuffer {
        const { data } = this;
        const nftNameBuf = Buffer.from(getNftName(data.asset), "utf8");
        const bufferSize = 32 + 1 + 21 + nftNameBuf.length;
        const buffer = new ByteBuffer(bufferSize, true);

        // Use unsigned 8 bits int for nft name length (should not be longer than 255)
        buffer.writeUint8(nftNameBuf.length);
        buffer.append(nftNameBuf, "utf8");
        buffer.append(Buffer.from(getCurrentNftAsset(data.asset).tokenId, "hex"));
        buffer.append(bs58check.decode(data.recipientId));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const nftNameSize = buf.readUint8();
        const nftName = buf.readBytes(nftNameSize).toUTF8();

        data.asset = {
            nft: {
                [nftName]: {
                    tokenId: buf.readBytes(32).toString("hex"),
                },
            },
        };
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }
}
