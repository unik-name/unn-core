import { Managers } from "@arkecosystem/crypto";
import { Keys } from "@arkecosystem/crypto/src/identities";
import { unsCrypto } from "@uns/crypto";
import "jest-extended";
import * as Fixtures from "../__fixtures__";

describe("uns-crypto.ts", () => {
    describe("validate DiscloseDemand signatures functions", () => {
        it("should get signature from payload and passphrase", () => {
            const signature = unsCrypto.signPayload(Fixtures.discloseDemandPayload, Fixtures.ownerPassphrase);
            expect(signature).toBeString();
            expect(signature).toBe(Fixtures.payloadSignature);
        });

        it("should get signature from certification payload and passphrase", () => {
            const signature = unsCrypto.signPayload(Fixtures.certificationPayload, Fixtures.issPassphrase);
            expect(signature).toBeString();
            expect(signature).toBe(Fixtures.certPayloadSignature);
        });

        it("should verify disclose demand signature successfully", () => {
            const res = unsCrypto.verifyPayload(
                Fixtures.discloseDemandPayload,
                Fixtures.payloadSignature,
                Fixtures.demanderKeys.publicKey,
            );
            expect(res).toBeTrue();
        });

        it("should get payload hash", () => {
            const res = unsCrypto.getPayloadHashBuffer(Fixtures.discloseDemandPayload).toString("hex");
            expect(res).toBeString();
            expect(res).toBe(Fixtures.certPayloadSub);
        });

        it("should verify certification signature successfully", () => {
            const res = unsCrypto.verifyPayload(
                Fixtures.certificationPayload,
                Fixtures.certPayloadSignature,
                Fixtures.issKeys.publicKey,
            );
            expect(res).toBeTrue();
        });

        it("wrong payload iat: should fail to verify signature", () => {
            const discloseDemandPayloadCopy = { ...Fixtures.discloseDemandPayload };
            discloseDemandPayloadCopy.iat = 456123;
            const res = unsCrypto.verifyPayload(
                discloseDemandPayloadCopy,
                Fixtures.payloadSignature,
                Fixtures.demanderKeys.publicKey,
            );
            expect(res).toBeFalse();
        });

        it("wrong public key: should fail to verify signature", () => {
            const wrongKeys = Keys.fromPassphrase("wrong passphrase");
            const res = unsCrypto.verifyPayload(
                Fixtures.certificationPayload,
                Fixtures.certPayloadSignature,
                wrongKeys.publicKey,
            );
            expect(res).toBeFalse();
        });

        it("wrong signature: should fail to verify signature", () => {
            const res = unsCrypto.verifyPayload(
                Fixtures.discloseDemandPayload,
                "3045022100e69c81d47ccdb0692b235f7249036be9edf871db81c0f981b9c583e6bb0f3f54022017906822f3095b1d01418b3f0086ccd419263a2f13590e7aa32d7c37deadbeef",
                Fixtures.demanderKeys.publicKey,
            );
            expect(res).toBeFalse();
        });
    });

    describe("verifyIssuerCredentials", () => {
        Managers.configManager.setFromPreset(Fixtures.network);

        it("should return true if Issuer id corresponds to authorized unikname forge factory", () => {
            expect(
                unsCrypto.verifyIssuerCredentials("5f96dd359ab300e2c702a54760f4d74a11db076aa17575179d36e06d75c96511"),
            ).toBeTrue();
        });

        it("should return false if Issuer id not corresponds to authorized unikname forge factory", () => {
            expect(unsCrypto.verifyIssuerCredentials("badissuerid")).toBeFalse();
        });
    });
});
