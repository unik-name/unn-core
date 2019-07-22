import { ConstraintApplicationContext } from "../../types";
import { Constraint } from "../constraint";
import { numberConstraint } from "./number";

class TypeConstraint implements Constraint {
    private allowedTypes: Constraint[] = [];

    public async apply(context: ConstraintApplicationContext, parameters?: any): Promise<void> {
        const constraint = this.allowedTypes.find(type => type.name() === parameters.type);
        if (constraint) {
            await constraint.apply(context, parameters);
        }
    }

    public name() {
        return "type";
    }

    public registerTypeConstraint(constraint: Constraint): TypeConstraint {
        this.allowedTypes.push(constraint);
        return this;
    }
}

export const typeConstraint = new TypeConstraint().registerTypeConstraint(numberConstraint);
