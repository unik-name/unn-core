import { Database } from "@arkecosystem/core-interfaces";
import { Model } from "../../models";

export class NftProperty extends Model {
    constructor(pgp) {
        super(pgp);

        this.columnsDescriptor = [
            {
                name: "nft_id",
                prop: "nftid",
                supportedOperators: [Database.SearchOperator.OP_EQ],
            },
            {
                name: "key",
                prop: "key",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "value",
                prop: "value",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
        ];
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "nftproperties";
    }
}
