import { ConstraintApplicationContext } from "../types";

export interface Constraint {
    /**
     * Control if given context respects constraint.
     * Throws a ConstraintError with a message describing error.
     * @param context context to apply constraint (transaction, property, value,...)
     * @param parameters constraint parameters from network configuration file
     */
    apply(context: ConstraintApplicationContext, parameters?: any): Promise<void>;
    name(): string;
}
