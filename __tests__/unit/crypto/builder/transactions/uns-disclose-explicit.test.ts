import "jest-extended";
import { client, constants, crypto, feeManager, models, unsCrypto } from "../../../../../packages/crypto";
import { buildDiscloseDemand } from "../../../../utils/helpers";

let builder;
let discloseDemand;
const TOKEN_ID = "6f35a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
const ISS_UNIK_ID = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
const ISS_PASSPHRASE = "iss passphrase";
const demanderKeys = crypto.getKeys(OWNER_PASSPHRASE);
const issKeys = crypto.getKeys(ISS_PASSPHRASE);

beforeEach(() => {
    builder = client.getBuilder().unsDiscloseExplicit();

    const discloseDemandPayload = {
        explicitValue: ["explicitValue", "anotherExplicitValue"],
        type: models.DIDTypes.INDIVIDUAL,
        iss: TOKEN_ID,
        sub: TOKEN_ID,
        iat: 12345678,
    };

    discloseDemand = buildDiscloseDemand(discloseDemandPayload, OWNER_PASSPHRASE, ISS_UNIK_ID, ISS_PASSPHRASE);

    builder
        .discloseDemand(discloseDemand["disclose-demand"], discloseDemand["disclose-demand-certification"])
        .sign(OWNER_PASSPHRASE)
        .secondSign("dummy passphrase");
});

describe("UnsDiscloseExplicit Transaction", () => {
    describe("verify", () => {
        it("should be valid with a signature", () => {
            expect(builder.build().verified).toBeTrue();
            expect(builder.verify()).toBeTrue();
        });
    });

    describe("getStruct", () => {
        it("should have its specific properties", () => {
            expect(builder).toHaveProperty("data.type", constants.TransactionTypes.UnsDiscloseExplicit);
            expect(builder).toHaveProperty("data.fee", feeManager.get(constants.TransactionTypes.UnsDiscloseExplicit));
            expect(builder).toHaveProperty("data.asset.disclose-demand", discloseDemand["disclose-demand"]);
            expect(builder).toHaveProperty(
                "data.asset.disclose-demand-certification",
                discloseDemand["disclose-demand-certification"],
            );
            expect(builder).toHaveProperty("data.amount", 0);
        });

        it("verify payload signatures", () => {
            let isVerified = unsCrypto.verifyPayload(
                builder.data.asset["disclose-demand"].payload,
                builder.data.asset["disclose-demand"].signature,
                demanderKeys.publicKey,
            );
            expect(isVerified).toBeTruthy();

            isVerified = unsCrypto.verifyPayload(
                builder.data.asset["disclose-demand-certification"].payload,
                builder.data.asset["disclose-demand-certification"].signature,
                issKeys.publicKey,
            );
            expect(isVerified).toBeTruthy();
        });
    });
});
