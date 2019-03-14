import "jest-extended";

import { bignumToUnicode, unicodeToBignum } from "../../src/utils";

describe("bignumToUnicode and unicodeToBignum", () => {
    it("should do convertion between unicode and bignum", () => {
        expect(bignumToUnicode(unicodeToBignum("hello"))).toEqual("hello");
    });
});
