import { Transactions } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { getCurrentNftAsset, getNftName } from "../utils";
import { computePropertiesSize } from "./utils";

export abstract class AbstractNftWithPropertiesTransaction extends Transactions.Transaction {
    public static serializeNftWithProperties(payload: any): ByteBuffer {
        const nftAsset = getCurrentNftAsset(payload);
        const nftNameBuf = Buffer.from(getNftName(payload), "utf8");
        const properties: { [_: string]: string } = nftAsset.properties || {};
        const bufferSize = 32 + 1 + computePropertiesSize(properties) + nftNameBuf.length;
        const buffer = new ByteBuffer(bufferSize, true);

        // Use unsigned 8 bits int for nft name length (should not be longer than 255)
        buffer.writeUint8(nftNameBuf.length);
        buffer.append(nftNameBuf, "utf8");

        buffer.append(Buffer.from(nftAsset.tokenId, "hex"));
        const keys = Object.keys(properties);

        // Use unsigned Int to serialize nb properties max 255 properties (max with signed 8 bits int is 127)
        buffer.writeUint8(keys.length);
        for (const propertyKey of keys) {
            const keyBytes = Buffer.from(propertyKey, "utf8");
            // Use unsigned 8 bits int for property key length (should not be longer than 255)
            buffer.writeUint8(keyBytes.length);
            buffer.append(keyBytes, "hex");
            const value = properties[propertyKey];
            if (!value && value !== "") {
                // Use signed 16 bits, to serialize at least 255 and -1 numbers
                buffer.writeInt16(-1);
            } else {
                const valueBytes = Buffer.from(value, "utf8");
                buffer.writeInt16(valueBytes.length);
                buffer.append(valueBytes, "hex");
            }
        }
        return buffer;
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        return this.serializePayload(data.asset);
    }

    public deserialize(buf: ByteBuffer): void {
        this.deserializePayload(buf);
    }

    public serializePayload(payload: any): ByteBuffer {
        return AbstractNftWithPropertiesTransaction.serializeNftWithProperties(payload);
    }

    public deserializePayload(buf: ByteBuffer): void {
        const { data } = this;
        const nftNameSize = buf.readUint8();
        const nftName = buf.readBytes(nftNameSize).toUTF8();
        const tokenId = buf.readBytes(32).toString("hex");

        data.asset = {
            nft: {
                [nftName]: {
                    tokenId,
                },
            },
        };

        // Use unsigned Int to serialize nb properties max 255 properties (max with signed 8 bits int is 127)
        const propertiesLength = buf.readUint8();

        if (propertiesLength > 0) {
            const properties: { [_: string]: string } = {};
            for (let i = 0; i < propertiesLength; i++) {
                const propertyKeyLength = buf.readUint8();
                const propertyKey = buf.readBytes(propertyKeyLength).toUTF8();

                const propertyValueLength = buf.readInt16();
                const propertyValue: string =
                    // null is needed for property deletion
                    // tslint:disable-next-line: no-null-keyword
                    propertyValueLength === -1 ? null : buf.readBytes(propertyValueLength).toUTF8();

                properties[propertyKey] = propertyValue;
            }
            data.asset.nft[nftName].properties = properties;
        }
    }
}
