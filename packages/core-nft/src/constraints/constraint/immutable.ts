import { getCurrentNftAsset } from "@uns/core-nft-crypto";
import { IConstraint, IConstraintApplicationContext } from "../../interfaces";
import { nftRepository } from "../../manager";
import { ConstraintError } from "../error";

/**
 * An immutable constraint is broken when a transaction tries to update a set property.
 * If property is not set (is null), constraint is not broken.
 */
export class ImmutableConstraint implements IConstraint {
    public async apply(context: IConstraintApplicationContext): Promise<void> {
        const { tokenId } = getCurrentNftAsset(context.transaction.asset);
        const currentValue = await nftRepository().findPropertyByKey(tokenId, context.key);
        if (currentValue !== null) {
            throw new ConstraintError(`immutable`);
        }
    }

    public name() {
        return "immutable";
    }
}
