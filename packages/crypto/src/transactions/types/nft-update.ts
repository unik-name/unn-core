import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { configManager } from "../../managers";
import { getCurrentNftAsset } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class NFTUpdateTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.NftUpdate;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.nftUpdate;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const nft = getCurrentNftAsset(data);
        const properties: { [_: string]: string } = nft.properties || {};
        const bufferSize = 32 + 1 + this.computePropertiesSize(properties);
        const buffer = new ByteBuffer(bufferSize, true);

        buffer.append(Buffer.from(nft.tokenId.padStart(64, "0"), "hex"));
        const keys = Object.keys(properties);

        // Use unsigned Int to serialize nb properties max 255 properties (max with signed 8 bits int is 127)
        buffer.writeUint8(keys.length);
        keys.forEach(propertyKey => {
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
        });
        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const tokenId = buf.readBytes(32).toString("hex");

        // Use unsigned Int to serialize nb properties max 255 properties (max with signed 8 bits int is 127)
        const propertiesLength = buf.readUint8();
        const properties: { [_: string]: string } = propertiesLength > 0 ? {} : undefined;

        for (let i = 0; i < propertiesLength; i++) {
            const propertyKeyLength = buf.readUint8();
            const propertyKey = buf.readBytes(propertyKeyLength).toUTF8();

            const propertyValueLength = buf.readInt16();
            const propertyValue: string =
                // null is needed for property deletion
                propertyValueLength === -1 ? null : buf.readBytes(propertyValueLength).toUTF8();

            properties[propertyKey] = propertyValue;
        }
        data.asset = {
            nft: {
                [configManager.getCurrentNftName()]: {
                    tokenId,
                    properties,
                },
            },
        };
    }

    /**
     * Returns number 1 byte for key buffer number, key buffer bytes number size, 1 byte for value buffer number and value buffer bytes number size of each property.
     * @param properties
     */
    private computePropertiesSize(properties: { [_: string]: string }): number {
        let size = 0;
        const keys = Object.keys(properties);

        keys.forEach(propertyKey => {
            const value = properties[propertyKey];
            let valueBytes;
            let valueLength = 0;
            if (value || value === "") {
                valueBytes = Buffer.from(value, "utf8");
                valueLength = valueBytes.length;
            }
            const keyBytes = Buffer.from(propertyKey, "utf8");
            size +=
                1 + // keyBytes length
                keyBytes.length + // keyBytes length value
                1 + // valueBytes length
                valueLength; // value
        });

        return size;
    }
}
