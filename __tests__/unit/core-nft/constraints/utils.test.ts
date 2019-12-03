import { genesisPropertiesReducer } from "../../../../packages/core-nft/src/constraints/utils";
import { CONSTRAINTS } from "../__fixtures__";

describe("core-nft > constraint utilities ", () => {
    describe("genesisPropertiesReducer", () => {
        it("should reduce ", () => {
            expect(Object.entries(CONSTRAINTS.unik.properties).reduce(genesisPropertiesReducer, [])).toStrictEqual([
                "type",
            ]);
        });
    });
});
