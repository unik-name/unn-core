import "jest-extended";
import {
    configManager,
    crypto,
    DiscloseDemandCertificationPayload,
    DiscloseDemandPayload,
    models,
    unsCrypto,
} from "../../../../packages/crypto/";

beforeEach(() => configManager.setFromPreset("devnet"));

describe("uns-crypto.ts", () => {
    describe("validate DiscloseDemand signatures functions", () => {
        const TOKEN_ID = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
        const OWNER_PASSPHRASE = "clay harbor enemy utility margin pretty hub comic piece aerobic umbrella acquire";
        const PAYLOAD_SIGNATURE =
            "3045022100e70fd4eb3b5bd25c536198994d40d3bbd20890951e4b2b55f0c57b88726fab5902202b2bdea828872153710c2b7b3122f28ac009bf85020039d871550300a0e1bbe2";
        const ISS_UNIK_ID = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
        const ISS_PASSPHRASE = "iss secret";
        const CERT_PAYLOAD_SIGNATURE =
            "3045022100a1361e93e279a74ea44a8e980360cfee4fbd0a2221d5ed38d1f75b6659f7577c02206eb8a5d6497ea55b84594daba67aa666bf992ad342bdc201ae4eb25d2f658702";
        const CERT_PAYLOAD_SUB = "333f59d345630a57184ceb8879500335ef8eafd5505ee25d0dbd53deaa2b7fd6";

        const discloseDemandPayload: DiscloseDemandPayload = {
            explicitValue: ["explicitValue1", "explicitValue2"],
            sub: TOKEN_ID,
            type: models.DIDTypes.ORGANIZATION,
            iss: TOKEN_ID,
            iat: 12345678,
        };
        const certificationPayload: DiscloseDemandCertificationPayload = {
            iss: ISS_UNIK_ID,
            sub: CERT_PAYLOAD_SUB,
            iat: 12345678,
        };

        const issKeys = crypto.getKeys(ISS_PASSPHRASE);
        const demanderKeys = crypto.getKeys(OWNER_PASSPHRASE);

        it("should get signature from payload and passphrase", () => {
            const signature = unsCrypto.signPayload(discloseDemandPayload, OWNER_PASSPHRASE);
            expect(signature).toBeString();
            expect(signature).toBe(PAYLOAD_SIGNATURE);
        });

        it("should get signature from certification payload and passphrase", () => {
            const signature = unsCrypto.signPayload(certificationPayload, ISS_PASSPHRASE);
            expect(signature).toBeString();
            expect(signature).toBe(CERT_PAYLOAD_SIGNATURE);
        });

        it("should verify disclose demand signature successfully", () => {
            const res = unsCrypto.verifyPayload(discloseDemandPayload, PAYLOAD_SIGNATURE, demanderKeys.publicKey);
            expect(res).toBeTrue();
        });

        it("should get payload hash", () => {
            const res = unsCrypto.getPayloadHashBuffer(discloseDemandPayload).toString("hex");
            expect(res).toBeString();
            expect(res).toBe(CERT_PAYLOAD_SUB);
        });

        it("should verify certification signature successfully", () => {
            const res = unsCrypto.verifyPayload(certificationPayload, CERT_PAYLOAD_SIGNATURE, issKeys.publicKey);
            expect(res).toBeTrue();
        });

        it("wrong payload iat: should fail to verify signature", () => {
            const discloseDemandPayloadCopy = { ...discloseDemandPayload };
            discloseDemandPayloadCopy.iat = 456123;
            const res = unsCrypto.verifyPayload(discloseDemandPayloadCopy, PAYLOAD_SIGNATURE, demanderKeys.publicKey);
            expect(res).toBeFalse();
        });

        it("wrong public key: should fail to verify signature", () => {
            const wrongKeys = crypto.getKeys("wrong passphrase");
            const res = unsCrypto.verifyPayload(certificationPayload, CERT_PAYLOAD_SIGNATURE, wrongKeys.publicKey);
            expect(res).toBeFalse();
        });

        it("wrong signature: should fail to verify signature", () => {
            const res = unsCrypto.verifyPayload(
                discloseDemandPayload,
                "3045022100e69c81d47ccdb0692b235f7249036be9edf871db81c0f981b9c583e6bb0f3f54022017906822f3095b1d01418b3f0086ccd419263a2f13590e7aa32d7c37deadbeef",
                demanderKeys.publicKey,
            );
            expect(res).toBeFalse();
        });
    });
});
