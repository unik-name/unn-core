import "jest-extended";
import { configMock, DEFAULT_CONFIG } from "../mocks/core-container";

import { ConstraintError } from "../../../../packages/core-nft/src/constraints";
import { ConstraintsManager } from "../../../../packages/core-nft/src/managers";

describe("Core-nft - constraint manager", () => {
    let manager;

    it("should pass when all genesis properties are set", () => {
        configMock.mockReturnValue(DEFAULT_CONFIG);
        manager = new ConstraintsManager();
        expect(() => manager.checkGenesisProperties(["genesisProperty", "propertyA", "propertyB"])).not.toThrow();
    });

    it("should throw when one genesis property is missing", () => {
        configMock.mockReturnValue(DEFAULT_CONFIG);
        manager = new ConstraintsManager();
        expect(() => manager.checkGenesisProperties(["propertyA", "propertyB"])).toThrowError(ConstraintError);
    });

    it("should pass when nft has no properties", () => {
        configMock.mockReturnValue(null);
        manager = new ConstraintsManager();
        expect(() => manager.checkGenesisProperties(["propertyA", "propertyB"])).not.toThrow();
    });

    it("should pass when nft has no genesis properties", () => {
        configMock.mockReturnValue({ foo: {} });
        manager = new ConstraintsManager();
        expect(() => manager.checkGenesisProperties(["propertyA", "propertyB"])).not.toThrow();
    });
});
