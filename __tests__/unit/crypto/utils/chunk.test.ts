import "jest-extended";

import { chunk } from "../../src/utils";

describe("chunk", () => {
    it("chould chunk string by 2", () => {
        expect(chunk("hell", 2)).toEqual(["he", "ll"]);
    });
    it("should chunk string by 2 with rest", () => {
        expect(chunk("hello world", 2)).toEqual(["he", "ll", "o ", "wo", "rl", "d"]);
    });
    it("should chunk string by 3 with rest of 1 character", () => {
        expect(chunk("hell", 3)).toEqual(["hel", "l"]);
    });
    it("should chunk string by 3 with rest of 2 character", () => {
        expect(chunk("hello world", 3)).toEqual(["hel", "lo ", "wor", "ld"]);
    });
});
