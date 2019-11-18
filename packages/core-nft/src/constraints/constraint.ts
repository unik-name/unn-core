import { NFT } from "@arkecosystem/core-interfaces";
import { IConstraint, IConstraintApplicationContext } from "../interfaces";

export abstract class Constraint implements IConstraint {
    constructor(protected repository: NFT.INftsRepository) {}
    public abstract apply(context: IConstraintApplicationContext, parameters?: any): Promise<void>;
    public abstract name(): string;
}
