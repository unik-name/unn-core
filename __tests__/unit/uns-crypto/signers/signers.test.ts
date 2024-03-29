import { Identities } from "@arkecosystem/crypto";
import {
    INftDemandCertificationPayload,
    IPayloadHashBuffer,
    IPayloadSigner,
    NftCertificationSigner,
    NftDemandHashBuffer,
} from "@uns/crypto";
import * as Fixtures from "../__fixtures__";

describe("Signers", () => {
    // Refactor this when a new Signer will be added
    // Theses tests can handle all type of *Signers

    describe("Validate xxxSigner functions", () => {
        const payload: INftDemandCertificationPayload = Fixtures.nftMintDemandCertificationPayload;

        let signer: IPayloadSigner;

        const payloadSignature = Fixtures.payloadNftMintDemandCertificationSignature;

        const issuerPublicKey = Fixtures.issKeys.publicKey;

        let payloadCopy;

        beforeEach(() => {
            signer = new NftCertificationSigner(payload);
        });

        describe("Should pass", () => {
            it("sign payload", () => {
                const signature = signer.sign(Fixtures.issPassphrase);
                expect(signature).toBeString();
                expect(signature).toBe(payloadSignature);
            });

            it("verify payload", () => {
                const res = signer.verify(payloadSignature, issuerPublicKey);
                expect(res).toBeTrue();
            });
        });

        describe("should fail", () => {
            beforeEach(() => {
                payloadCopy = { ...payload };
            });

            it("wrong payload iat: should fail to verify signature", () => {
                payloadCopy.iat = 456123;

                const signer: IPayloadSigner = new NftCertificationSigner(payloadCopy);
                const res = signer.verify(payloadSignature, issuerPublicKey);
                expect(res).toBeFalse();
            });

            it("wrong public key: should fail to verify signature", () => {
                const wrongKeys = Identities.Keys.fromPassphrase("wrong passphrase");
                const res = signer.verify(payloadSignature, wrongKeys.publicKey);
                expect(res).toBeFalse();
            });

            it("wrong signature: should fail to verify signature", () => {
                const res = signer.verify(
                    "3045022100e69c81d47ccdb0692b235f7249036be9edf871db81c0f981b9c583e6bb0f3f54022017906822f3095b1d01418b3f0086ccd419263a2f13590e7aa32d7c37deadbeef",
                    issuerPublicKey,
                );
                expect(res).toBeFalse();
            });
        });
    });

    describe("Validate getPayload hash buffer functions", () => {
        let payloadHashBuffer: IPayloadHashBuffer;

        const payload = Fixtures.nftMintRequest;

        beforeEach(() => {
            payloadHashBuffer = new NftDemandHashBuffer(payload);
        });

        it("should get payload hash", () => {
            const res = payloadHashBuffer.getPayloadHashBuffer();
            expect(res).toBeString();
            expect(res).toBe(Fixtures.payloadNftMintDemandHashBuffer);
        });
    });
});
