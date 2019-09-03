import "jest-extended";

import { SATOSHI } from "../../../../packages/crypto/src/constants";
import { Bignum, formatSatoshi } from "../../../../packages/crypto/src/utils";

describe("Format Satoshi", () => {
    it("should format satoshis", () => {
        expect(formatSatoshi(SATOSHI)).toBe("1 DUNS");
        expect(formatSatoshi(0.1 * SATOSHI)).toBe("0.1 DUNS");
        expect(formatSatoshi((0.1 * SATOSHI).toString())).toBe("0.1 DUNS");
        expect(formatSatoshi(new Bignum(10))).toBe("0.0000001 DUNS");
        expect(formatSatoshi(new Bignum(SATOSHI + 10012))).toBe("1.00010012 DUNS");
    });
});
