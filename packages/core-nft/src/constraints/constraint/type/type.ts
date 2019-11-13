import { IConstraint, IConstraintApplicationContext } from "../../../interfaces";

export class TypeConstraint implements IConstraint {
    private allowedTypes: IConstraint[] = [];

    public async apply(context: IConstraintApplicationContext, parameters?: any): Promise<void> {
        const constraint = this.allowedTypes.find(type => type.name() === parameters.type);
        if (constraint) {
            await constraint.apply(context, parameters);
        }
    }

    public name() {
        return "type";
    }

    public registerTypeConstraint(constraint: IConstraint): TypeConstraint {
        this.allowedTypes.push(constraint);
        return this;
    }
}
