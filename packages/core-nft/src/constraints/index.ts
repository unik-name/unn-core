import { IConstraint } from "./constraint";
import { enumerationConstraint } from "./enumeration";
import { ConstraintError } from "./error";
import { immutableConstraint } from "./immutable";
import { typeConstraint } from "./type";

const constraints: IConstraint[] = [immutableConstraint, typeConstraint, enumerationConstraint];

export { IConstraint, ConstraintError, constraints };
