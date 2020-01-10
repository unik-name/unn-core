import { IConstraint, IConstraintApplicationContext } from "../../interfaces";
import { ConstraintError } from "../error";

/**
 * An regex constraint is broken when new property key doesn't match pattern.
 */
export class RegexConstraint implements IConstraint {
    public async apply(context: IConstraintApplicationContext, parameters?: any): Promise<void> {
        const toCheck: string = context[parameters.contextAttribute];
        if (!toCheck || !toCheck.match(parameters.pattern) || toCheck.match(parameters.pattern)[0] !== toCheck) {
            throw new ConstraintError(
                `pattern regex (${parameters.contextAttribute}: '${toCheck}', pattern: ${parameters.pattern})`,
            );
        }
    }

    public name() {
        return "regex";
    }
}
