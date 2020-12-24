import { Transactions, Utils } from "@arkecosystem/crypto";
import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { NftTransactionGroup, NftTransactionStaticFees, NftTransactionType } from "../enums";
import { AbstractNftWithPropertiesTransaction } from "./abstract-nft-with-properties";
import { NftSchemas } from "./utils";

const { schemas } = Transactions;

export class NftTransferTransaction extends AbstractNftWithPropertiesTransaction {
    public static typeGroup: number = NftTransactionGroup;
    public static type: number = NftTransactionType.NftTransfer;
    public static key: string = "NftTransfer";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "nftTransfer",
            required: ["asset", "recipientId"],
            properties: {
                type: { transactionType: NftTransactionType.NftTransfer },
                typeGroup: { const: NftTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
                recipientId: { $ref: "address" },
                ...schemas.extend(NftSchemas.nft, NftSchemas.nftProperties),
            },
        });
    }

    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make(NftTransactionStaticFees.NftTransfer);

    public serialize(): ByteBuffer {
        const { data } = this;
        const recipientBytesSize = 21;
        const buffer = this.serializePayload(data.asset, recipientBytesSize);
        buffer.append(bs58check.decode(data.recipientId));
        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        this.deserializePayload(buf);
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }
}
