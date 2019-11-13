import { IConstraint, IConstraintApplicationContext } from "../../interfaces";
import { ConstraintError } from "../error";

/**
 * An enumeration constraint is broken when new property value is not included in possible values (set in `parameters`).
 */
export class EnumerationConstraint implements IConstraint {
    public async apply(context: IConstraintApplicationContext, parameters?: any): Promise<void> {
        if (!parameters.values.includes(context.value)) {
            throw new ConstraintError(`enumeration`);
        }
    }

    public name() {
        return "enumeration";
    }
}
