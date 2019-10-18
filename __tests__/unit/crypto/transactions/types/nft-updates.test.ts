import { getProperties, nftupdateTransactionStruct } from "../__fixtures__/nft-update";

import { TransactionTypes } from "../../../../../packages/crypto/src/constants";
import { ITransactionData } from "../../../../../packages/crypto/src/transactions";
import { checkSerializedTxCommon, deserialize, serialize } from "../__fixtures__/transaction";

describe("NFTUpdate serialization/deserialization", () => {
    const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
    const SENDER_PK = "03287bfebba4c7881a0509717e71b34b63f31e40021c321f89ae04f84be6d6ac37";
    const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
    const MAX_UPDATE_PROPERTIES = 255;

    let transaction: ITransactionData;

    const assertSerializeDeserialize = (
        tokenid: string,
        sender: string,
        owner: string,
        properties: { [_: string]: string },
    ) => {
        transaction = nftupdateTransactionStruct(tokenid, sender, owner, properties);

        const serializedTransaction = serialize(transaction);

        const deserializedTransaction = deserialize(serializedTransaction);

        checkSerializedTxCommon(transaction, deserializedTransaction);

        expect(deserializedTransaction).toHaveProperty("type");
        expect(deserializedTransaction.type).toEqual(transaction.type);
        expect(deserializedTransaction.type).toEqual(TransactionTypes.NftUpdate);

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
