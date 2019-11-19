import { Transactions, Utils } from "@arkecosystem/crypto";
import { schemas } from "@arkecosystem/crypto/src/transactions";
import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "../enums";
import { NftSchemas } from "./utils";
import { getCurrentNftAsset, getNftNameFromConfig } from "../utils";

export class NFTTransferTransaction extends Transactions.Transaction {

    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftTransfer;
    public static key: string = "NftTransfer";

    public static getSchema(): schemas.TransactionSchema {
        return NftSchemas.nftTransfer;
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(
        NftTransactionStaticFees.NftTransfer,
    );

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
                [getNftNameFromConfig()]: {
                    tokenId: buf.readBytes(32).toString("hex"),
                },
            },
        };
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }
}
