import { getCurrentNftAsset } from "@arkecosystem/crypto";
import { NFTModifier } from "../modifier";
import { ConstraintApplicationContext } from "../types";
import { Constraint } from "./constraint";
import { ConstraintError } from "./error";

/**
 * An immutable constraint is broken when a transaction tries to update a set property.
 * If property is not set (is null), constraint is not broken.
 */
class ImmutableConstraint implements Constraint {
    public async apply(context: ConstraintApplicationContext): Promise<void> {
        const { tokenId } = getCurrentNftAsset(context.transaction);

        const currentValue = await NFTModifier.getProperty(tokenId, context.propertyKey);

        if (currentValue !== null) {
            throw new ConstraintError(`immutable`);
        }
    }

    public name() {
        return "immutable";
    }
}

export const immutableConstraint = new ImmutableConstraint();
