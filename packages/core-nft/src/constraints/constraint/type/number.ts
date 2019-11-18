import { IConstraintApplicationContext } from "../../../interfaces";
import { Constraint } from "../../constraint";
import { ConstraintError } from "../../error";

/**
 * A number constraint can be broken if new property value is not a number.
 * More constraints on number can be added as constraint parameters:
 *  - a maximum value
 *  - a minimum value
 */
export class NumberConstraint extends Constraint {
    public async apply(context: IConstraintApplicationContext, parameters?: any): Promise<void> {
        const value = context.value;

        if (Number.isNaN(+value)) {
            throw new ConstraintError(`not a number : ${value} -> ${typeof value}`);
        }
        const valueNumber: number = +value;
        const { min, max } = parameters;
        if (min && valueNumber < min) {
            throw new ConstraintError(`lower bound : ${valueNumber} < ${min}`);
        }
        if (max && valueNumber > max) {
            throw new ConstraintError(`upper bound : ${valueNumber} > ${max}`);
        }
    }

    public name() {
        return "number";
    }
}
