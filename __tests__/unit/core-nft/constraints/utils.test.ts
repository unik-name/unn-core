import { genesisPropertiesReducer } from "../../../../packages/core-nft/src/constraints/utils";
import { constraints } from "../__fixtures__";

describe("core-nft > constraint utilities ", () => {
    describe("genesisPropertiesReducer", () => {
        it("should reduce ", () => {
            expect(Object.entries(constraints.mynft.properties).reduce(genesisPropertiesReducer, [])).toStrictEqual([
                "genesisProp",
            ]);
        });
    });
});
