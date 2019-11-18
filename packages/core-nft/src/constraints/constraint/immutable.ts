import { IConstraintApplicationContext } from "../../interfaces";
import { getCurrentNftAsset } from "../../utils";
import { Constraint } from "../constraint";
import { ConstraintError } from "../error";

/**
 * An immutable constraint is broken when a transaction tries to update a set property.
 * If property is not set (is null), constraint is not broken.
 */
export class ImmutableConstraint extends Constraint {
    public async apply(context: IConstraintApplicationContext): Promise<void> {
        const { tokenId } = getCurrentNftAsset(context.transaction);
        const currentValue = await this.repository.findPropertyByKey(tokenId, context.key);
        if (currentValue !== null) {
            throw new ConstraintError(`immutable`);
        }
    }

    public name() {
        return "immutable";
    }
}
