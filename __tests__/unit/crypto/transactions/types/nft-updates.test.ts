import { getProperties, nftupdateTransactionStruct } from "../__fixtures__/nft-update";

import { TransactionTypes } from "../../../../../packages/crypto/src/constants";
import { ITransactionData, Transaction, TransactionRegistry } from "../../../../../packages/crypto/src/transactions";
import { TransactionDeserializer } from "../../../../../packages/crypto/src/transactions/deserializers";
import { TransactionSerializer } from "../../../../../packages/crypto/src/transactions/serializers";

describe("NFTUpdate serialization/deserialization", () => {
    const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
    const SENDER_PK = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
    const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
    const MAX_UPDATE_PROPERTIES = 255;

    let transaction: ITransactionData;

    const serialize = (transaction: ITransactionData): Buffer => {
        const nftTransaction: Transaction = TransactionRegistry.create(transaction);
        TransactionDeserializer.applyV1Compatibility(nftTransaction.data);
        return TransactionSerializer.serialize(nftTransaction);
    };

    const deserialize = (serializedTransactionBuffer: Buffer): ITransactionData => {
        return TransactionDeserializer.deserialize(serializedTransactionBuffer).data;
    };

    const assertSerializeDeserialize = (
        tokenid: string,
        sender: string,
        owner: string,
        properties: { [_: string]: string },
    ) => {
        transaction = nftupdateTransactionStruct(tokenid, sender, owner, properties);

        const serializedTransaction = serialize(transaction);

        const deserializedTransaction = deserialize(serializedTransaction);

        expect(deserializedTransaction).toHaveProperty("signature");
        expect(deserializedTransaction.signature).toEqual(transaction.signature);

        expect(deserializedTransaction).toHaveProperty("timestamp");
        expect(deserializedTransaction.timestamp).toEqual(transaction.timestamp);

        expect(deserializedTransaction).toHaveProperty("version");
        expect(deserializedTransaction.version).toEqual(transaction.version);

        expect(deserializedTransaction).toHaveProperty("type");
        expect(deserializedTransaction.type).toEqual(transaction.type);
        expect(deserializedTransaction.type).toEqual(TransactionTypes.NftUpdate);

        expect(deserializedTransaction).toHaveProperty("fee");
        expect(parseInt(deserializedTransaction.fee as string)).toEqual(transaction.fee);

        expect(deserializedTransaction).toHaveProperty("senderPublicKey");
        expect(deserializedTransaction.senderPublicKey).toEqual(transaction.senderPublicKey);

        expect(deserializedTransaction).toHaveProperty("amount");
        expect(parseInt(deserializedTransaction.amount as string)).toEqual(transaction.amount);

        expect(deserializedTransaction).toHaveProperty("asset.nft.unik.tokenId");
        expect(deserializedTransaction.asset.nft.unik.tokenId).toEqual(transaction.asset.nft.unik.tokenId);
        expect(deserializedTransaction.asset.nft.unik.tokenId).toEqual(TOKEN_ID);

        expect(deserializedTransaction).toHaveProperty("asset.nft.unik.properties");
        for (const prop of Object.keys(properties)) {
            expect(deserializedTransaction).toHaveProperty(`asset.nft.unik.properties.${prop}`);
            expect(deserializedTransaction.asset.nft.unik.properties[prop]).toEqual(properties[prop]);
        }
    };

    it("Serialize/Deserialize NFTUpdate transaction with a property", () => {
        assertSerializeDeserialize(TOKEN_ID, SENDER_PK, OWNER_PASSPHRASE, getProperties(1));
    });

    it(`Serialize/Deserialize NFTUpdate transaction with ${MAX_UPDATE_PROPERTIES} properties`, () => {
        assertSerializeDeserialize(TOKEN_ID, SENDER_PK, OWNER_PASSPHRASE, getProperties(MAX_UPDATE_PROPERTIES));
    });
});
