import { constants, ITransactionData, models } from "../../../../../packages/crypto/";
import { buildDiscloseDemand } from "../../../../utils/helpers";
import { checkSerializedTxCommon, deserialize, serialize } from "../__fixtures__/transaction";
import { discloseExplicitTransactionStruct } from "../__fixtures__/uns-disclose-explicit";

describe("Disclose Explicit serialization/deserialization", () => {
    const TOKEN_ID = "1805f38f410dcd05f1dd2ce3a9aadd485300cf4a3651b6a71058142f299de971";
    const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
    const ISS_UNIK_ID = "be7c7036307e35f2f5a83f302d49956906ddd80df55ed7bff1f876524762f2f3";
    const ISS_PASSPHRASE = "secret";

    const discloseDemandPayload = {
        explicitValue: ["explicitValue", "anotherExplicitValue"],
        type: models.DIDTypes.INDIVIDUAL,
        sub: TOKEN_ID,
        iss: TOKEN_ID,
        iat: 1571241182143,
    };
    const discloseDemand = buildDiscloseDemand(discloseDemandPayload, OWNER_PASSPHRASE, ISS_UNIK_ID, ISS_PASSPHRASE);

    const checkSerializedTxSpecific = (transaction, deserializedTransaction) => {
        expect(deserializedTransaction).toHaveProperty("type");
        expect(deserializedTransaction.type).toEqual(transaction.type);
        expect(deserializedTransaction.type).toEqual(constants.TransactionTypes.UnsDiscloseExplicit);

        expect(deserializedTransaction).toHaveProperty("asset.disclose-demand");
        expect(deserializedTransaction.asset["disclose-demand"].payload).toEqual(
            discloseDemand["disclose-demand"].payload,
        );
        expect(deserializedTransaction.asset["disclose-demand"].signature).toEqual(
            discloseDemand["disclose-demand"].signature,
        );

        expect(deserializedTransaction).toHaveProperty("asset.disclose-demand-certification");
        expect(deserializedTransaction.asset["disclose-demand-certification"].payload).toEqual(
            discloseDemand["disclose-demand-certification"].payload,
        );
        expect(deserializedTransaction.asset["disclose-demand-certification"].signature).toEqual(
            discloseDemand["disclose-demand-certification"].signature,
        );
    };

    it("Serialize/Deserialize Disclose explicit demand transaction", () => {
        const transaction: ITransactionData = discloseExplicitTransactionStruct(discloseDemand, OWNER_PASSPHRASE);
        const deserializedTransaction = deserialize(serialize(transaction));

        checkSerializedTxCommon(transaction, deserializedTransaction);
        checkSerializedTxSpecific(transaction, deserializedTransaction);
    });
});
