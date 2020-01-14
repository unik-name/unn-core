import { Keys } from "@arkecosystem/crypto/dist/identities";
import {
    IPayloadHashBuffer,
    IPayloadSigner,
    NftMintDemandCertificationSigner,
    NftMintDemandPayloadHashBuffer,
} from "@uns/crypto";
import { ICertificationable } from "@uns/crypto/dist/interfaces/certification";
import "jest-extended";
import * as Fixtures from "../__fixtures__";

describe("Signers", () => {
    // Refactor this when a new Signer will be added
    // Theses tests can handle all type of *Signers

    describe("Validate xxxSigner functions", () => {
        const payload: Required<ICertificationable> = Fixtures.nftMintDemandCertificationPayload;

        let signer: IPayloadSigner;

        const passphrase = Fixtures.ownerPassphrase;

        const payloadSignature = Fixtures.payloadNftMintDemandCertificationSignature;

        const publicKey = Fixtures.demanderKeys.publicKey;

        let payloadCopy;

        beforeEach(() => {
            signer = new NftMintDemandCertificationSigner(payload);
        });

        describe("Should pass", () => {
            it("sign payload", () => {
                const signature = signer.sign(passphrase);
                expect(signature).toBeString();
                expect(signature).toBe(payloadSignature);
            });

            it("verify payload", () => {
                const res = signer.verify(payloadSignature, publicKey);
                expect(res).toBeTrue();
            });
        });

        describe("should fail", () => {
            beforeEach(() => {
                payloadCopy = { ...payload };
            });

            it("wrong payload iat: should fail to verify signature", () => {
                payloadCopy.iat = 456123;

                const signer: IPayloadSigner = new NftMintDemandCertificationSigner(payloadCopy);
                const res = signer.verify(payloadSignature, publicKey);
                expect(res).toBeFalse();
            });

            it("wrong public key: should fail to verify signature", () => {
                const wrongKeys = Keys.fromPassphrase("wrong passphrase");
                const res = signer.verify(payloadSignature, wrongKeys.publicKey);
                expect(res).toBeFalse();
            });

            it("wrong signature: should fail to verify signature", () => {
                const res = signer.verify(
                    "3045022100e69c81d47ccdb0692b235f7249036be9edf871db81c0f981b9c583e6bb0f3f54022017906822f3095b1d01418b3f0086ccd419263a2f13590e7aa32d7c37deadbeef",
                    publicKey,
                );
                expect(res).toBeFalse();
            });
        });
    });

    describe("Validate getPayload hash buffer functions", () => {
        let payloadHashBuffer: IPayloadHashBuffer;

        const payload = Fixtures.nftMintDemandHashBufferPayload;

        beforeEach(() => {
            payloadHashBuffer = new NftMintDemandPayloadHashBuffer(payload);
        });

        it("should get payload hash", () => {
            const res = payloadHashBuffer.getPayloadHashBuffer();
            expect(res).toBeString();
            expect(res).toBe(Fixtures.payloadNftMintDemandHashBuffer);
        });
    });
});
