import { NFTModifier } from "../modifier";
import { ConstraintApplicationContext } from "../types";
import { Constraint } from "./constraint";
import { ConstraintError } from "./error";

/**
 * An enumeration constraint is broken when new property value is not included in possible values (set in `parameters`).
 */
class EnumerationConstraint implements Constraint {
    public async apply(context: ConstraintApplicationContext, parameters?: any): Promise<void> {
        if (!parameters.values.includes(context.propertyNewValue)) {
            throw new ConstraintError(`enumeration`);
        }
    }

    public name() {
        return "enumeration";
    }
}

export const enumerationConstraint = new EnumerationConstraint();
