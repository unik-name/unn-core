import { DIDHelpers, DIDTypes } from "../../../../packages/crypto/src/models";

describe("Models - DID", () => {
    describe("labels", () => {
        it("should return labels as not empty string", () => {
            const matcher = expect(DIDHelpers.labels());
            matcher.toBeDefined();
            matcher.toBeArrayOfSize(3);
            matcher.toSatisfyAll(x => !!x);
        });
    });

    describe("codes", () => {
        it("should return codes as positive number", () => {
            const matcher = expect(DIDHelpers.codes());
            matcher.toBeDefined();
            matcher.toBeArrayOfSize(3);
            matcher.toSatisfyAll(x => x > 0);
        });
    });

    describe("fromCode", () => {
        it("should return label of known type", () => {
            expect(DIDHelpers.fromCode(DIDTypes.INDIVIDUAL)).toBe("INDIVIDUAL");
        });
        it("should return 'undefined' from unknown code", () => {
            expect(DIDHelpers.fromCode(0)).toBeUndefined();
            expect(DIDHelpers.fromCode(1000)).toBeUndefined();
            expect(DIDHelpers.fromCode(-1)).toBeUndefined();
        });
    });

    describe("fromLabel", () => {
        it("should return code of known type", () => {
            expect(DIDHelpers.fromLabel("INDIVIDUAL")).toBe(DIDTypes.INDIVIDUAL);
        });
    });
});
