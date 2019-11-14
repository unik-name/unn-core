import { IConstraintApplicationContext } from "../types";
import { IConstraint } from "./constraint";
import { ConstraintError } from "./error";

/**
 * An enumeration constraint is broken when new property value is not included in possible values (set in `parameters`).
 */
class EnumerationConstraint implements IConstraint {
    public async apply(context: IConstraintApplicationContext, parameters?: any): Promise<void> {
        if (!parameters.values.includes(context.propertyNewValue)) {
            throw new ConstraintError(`enumeration`);
        }
    }

    public name() {
        return "enumeration";
    }
}

export const enumerationConstraint = new EnumerationConstraint();
