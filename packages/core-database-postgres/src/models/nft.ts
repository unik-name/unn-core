import { Database } from "@arkecosystem/core-interfaces";
import { Model } from "./model";

export class Nft extends Model {
    constructor(pgp) {
        super(pgp);

        this.columnsDescriptor = [
            {
                name: "id",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
            {
                name: "owner_id",
                prop: "ownerId",
                supportedOperators: [Database.SearchOperator.OP_EQ, Database.SearchOperator.OP_IN],
            },
        ];
    }

    /**
     * The table associated with the model.
     * @return {String}
     */
    public getTable() {
        return "nfts";
    }
}
