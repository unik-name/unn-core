import { Constraint } from "./constraint";
import { enumerationConstraint } from "./enumeration";
import { ConstraintError } from "./error";
import { immutableConstraint } from "./immutable";
import { typeConstraint } from "./type";

const constraints: Constraint[] = [immutableConstraint, typeConstraint, enumerationConstraint];

export { Constraint, ConstraintError, constraints };
