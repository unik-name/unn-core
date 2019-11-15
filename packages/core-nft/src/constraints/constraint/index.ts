import { EnumerationConstraint } from "./enumeration";
import { ImmutableConstraint } from "./immutable";
import { NumberConstraint, TypeConstraint } from "./type";

export const constraints = [
    new ImmutableConstraint(),
    new EnumerationConstraint(),
    new TypeConstraint().registerTypeConstraint(new NumberConstraint()),
];
