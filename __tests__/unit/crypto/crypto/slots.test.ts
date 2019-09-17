import "jest-extended";

import { slots } from "../../../../packages/crypto/src/crypto/slots";
import { configManager } from "../../../../packages/crypto/src/managers/config";
import { devnet } from "../../../../packages/crypto/src/networks";

beforeEach(() => configManager.setConfig(devnet));

describe("Slots", () => {
    describe("getHeight", () => {
        it("should return the set height", () => {
            expect(slots.getHeight()).toBe(1);
        });
    });

    describe("setHeight", () => {
        it("should set the height", () => {
            slots.setHeight(123);

            expect(slots.getHeight()).toBe(123);
        });
    });

    describe("resetHeight", () => {
        it("should reset the height", () => {
            slots.setHeight(123);

            expect(slots.getHeight()).toBe(123);

            slots.resetHeight();

            expect(slots.getHeight()).toBe(1);
        });
    });

    describe("getEpochTime", () => {
        it("return epoch datetime", () => {
            expect(slots.getEpochTime()).toBeNumber();
        });
    });

    describe("beginEpochTime", () => {
        it("return epoch datetime", () => {
            expect(slots.beginEpochTime().toISO()).toBe("2019-09-17T10:08:26.000Z");
        });

        it("return epoch unix", () => {
            expect(slots.beginEpochTime().toUnix()).toBe(1568714906);
        });
    });

    describe("getTime", () => {
        it("return epoch time as number", () => {
            const result = slots.getTime(1568714916000);

            expect(result).toBeNumber();
            expect(result).toEqual(10);
        });
    });

    describe("getRealTime", () => {
        it("return real time", () => {
            expect(slots.getRealTime(10)).toBe(1568714916000);
        });

        it("should call this.getTime when called without time", () => {
            const getTime = jest.spyOn(slots, "getTime");
            slots.getRealTime(undefined);
            expect(getTime).toHaveBeenCalledTimes(1);
        });
    });

    describe("getSlotNumber", () => {
        it("return slot number", () => {
            expect(slots.getSlotNumber(10)).toBe(1);
        });
    });

    describe("getSlotTime", () => {
        it("returns slot time", () => {
            expect(slots.getSlotTime(19614)).toBe(156912);
        });
    });

    describe("getNextSlot", () => {
        it("returns next slot", () => {
            expect(slots.getNextSlot()).toBeNumber();
        });
    });

    describe("isForgingAllowed", () => {
        it("returns boolean", () => {
            expect(slots.isForgingAllowed()).toBeDefined();
        });
    });

    describe("getTimeInMsUntilNextSlot", () => {
        it("should be ok", () => {
            const nextSlotTime = slots.getSlotTime(slots.getNextSlot());
            const now = slots.getTime();

            expect(slots.getTimeInMsUntilNextSlot()).toEqual((nextSlotTime - now) * 1000);
        });
    });
});
