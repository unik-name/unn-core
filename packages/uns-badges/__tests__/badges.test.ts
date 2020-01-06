import "jest-extended";
import * as defaults from "./__fixtures__/default_badges";
/* tslint:disable:no-var-requires */
const plugin = require("../src/plugin-utils");
const coreNft = require("@uns/core-nft");

const NFT = {
    id: "id",
    ownerId: "ownerId",
};

describe("Badges tests", () => {
    const containerMock = jest.fn();
    beforeAll(() => {
        plugin.hasSecondPassphrase = jest.fn().mockReturnValue(true);
    });

    describe("Test uniks/{unikid}/properties route", () => {
        it("should set all individual default badges", () => {
            let properties = [{ type: "1" }];
            properties = plugin.handlePropertiesRequest(properties, NFT, containerMock);
            expect(properties).toIncludeAllMembers(defaults.individualDefaultBadges);
        });

        it("should set all organization default badges", () => {
            let properties = [{ type: "2" }];
            properties = plugin.handlePropertiesRequest(properties, NFT, containerMock);
            expect(properties).toIncludeAllMembers(defaults.organizationDefaultBadges);
        });

        it("should set all network default badges", () => {
            let properties = [{ type: "3" }];
            properties = plugin.handlePropertiesRequest(properties, NFT, containerMock);
            expect(properties).toIncludeAllMembers(defaults.networkDefaultBadges);
        });

        it("should keep already set property", () => {
            let properties = [{ type: "2" }, { "Badges/NP/StorageProvider": true }];
            properties = plugin.handlePropertiesRequest(properties, NFT, containerMock);
            expect(properties).toIncludeAllMembers([{ "Badges/NP/StorageProvider": true }]);
        });

        it("should contains secondPassphrase badge", () => {
            let properties = [{ type: "2" }];
            properties = plugin.handlePropertiesRequest(properties, NFT, containerMock);
            expect(properties).toIncludeAllMembers([{ "Badges/Security/SecondPassphrase": true }]);
        });
    });

    describe("Test uniks/{unikid}/properties/{badge_key} route", () => {
        beforeEach(() => {
            coreNft.nftRepository = jest.fn(() => {
                return {
                    findPropertyByKey: (_, propertyKey) => {
                        let val;
                        switch (propertyKey) {
                            case "type":
                                val = "1";
                                break;
                        }
                        return { key: propertyKey, value: val };
                    },
                };
            });
        });

        it("should return second passphrase badge value", async () => {
            const value = await plugin.handlePropertyValueRequest(
                "Badges/Security/SecondPassphrase",
                NFT,
                containerMock,
            );
            expect(value).toBeTrue();
        });

        it("should return XPLevel badge default value", async () => {
            const value = await plugin.handlePropertyValueRequest("Badges/XPLevel", NFT, containerMock);
            expect(value).toEqual(1);
        });

        it("should return Multisig badge default value", async () => {
            const value = await plugin.handlePropertyValueRequest("Badges/Security/Multisig", NFT, containerMock);
            expect(value).toBeFalse();
        });

        it("should return undefined for Verified badge for Individual UNIK", async () => {
            const value = await plugin.handlePropertyValueRequest("Badges/Rightness/Verified", NFT, containerMock);
            expect(value).toBeUndefined();
        });

        it("should return undefined for unknown badge", async () => {
            const value = await plugin.handlePropertyValueRequest("Badges/Tatalol", NFT, containerMock);
            expect(value).toBeUndefined();
        });
    });
});
