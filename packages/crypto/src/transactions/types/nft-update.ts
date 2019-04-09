import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { Bignum, sum } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class NFTUpdateTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.NftUpdate;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.nftUpdate;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const properties = data.asset.nft.properties;
        const bufferSize = this.computePropertiesSize(properties) + 33;
        const buffer = new ByteBuffer(bufferSize, true);

        buffer.append(new Bignum(data.asset.nft.tokenId).toString(16).padStart(32, "0"), "hex");
        buffer.writeByte(data.asset.nft.properties.length);
        properties.map(([key, value]) => {
            const keyBytes = Buffer.from(key, "utf8");
            buffer.writeByte(keyBytes.length);
            buffer.append(keyBytes, "hex");
            buffer.append(value, "hex");
        });

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {
            nft: {
                tokenId: new Bignum(buf.readBytes(16).toHex(), 16),
            },
        };
        const properties = [];
        const propertiesLength = buf.readByte();
        for (let i = 0; i < propertiesLength; i++) {
            const propertyKeyLength = buf.readByte();
            const propertyKey = buf.readBytes(propertyKeyLength).toUTF8();
            const propertyValue = buf.readBytes(32).toHex();
            properties.push([propertyKey, propertyValue]);
        }
        data.asset.nft.properties = properties;
    }

    private computePropertiesSize(properties: Array<[string, string]>): number {
        return properties
            .map(([key, _]) => {
                return key.length + 33;
            })
            .reduce(sum);
    }
}
