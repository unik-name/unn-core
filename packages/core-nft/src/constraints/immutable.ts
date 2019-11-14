import { getCurrentNftAsset } from "@uns/crypto";
import { NFTModifier } from "../modifier";
import { IConstraintApplicationContext } from "../types";
import { IConstraint } from "./constraint";
import { ConstraintError } from "./error";

/**
 * An immutable constraint is broken when a transaction tries to update a set property.
 * If property is not set (is null), constraint is not broken.
 */
class ImmutableConstraint implements IConstraint {
    public async apply(context: IConstraintApplicationContext): Promise<void> {
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
