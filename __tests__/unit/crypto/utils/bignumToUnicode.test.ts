import "jest-extended";

import { bignumToUnicode, unicodeToBignumBuffer } from "../../src/utils";

describe("bignumToUnicode and unicodeToBignumBuffer", () => {
    it("should do convertion between unicode and bignum", () => {
        expect(bignumToUnicode(unicodeToBignumBuffer("hello").toString())).toEqual("hello");
    });
});
