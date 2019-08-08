import { app } from "@arkecosystem/core-container";
import { Constraint, ConstraintError, constraints } from "../constraints";
import { ConstraintApplicationContext } from "../types";

const nftPropertiesConfig = app.getConfig().get("network.nft.properties");

interface NetworkConstraint {
    name: string;
    parameters: any;
}

export class ConstraintsManager {
    private registeredConstraints: { [_: string]: Constraint } = {};

    constructor() {
        this.registerConstraints();
    }

    public registerConstraint(constraint: Constraint) {
        this.registeredConstraints[constraint.name()] = constraint;
    }

    public async getAndApplyConstraints(context: ConstraintApplicationContext) {
        // Get constraints declared from network configuration file
        for (const constraint of this.getNetworkConstraints(context.propertyKey)) {
            // Get constraint logic instance
            const constraintLogic = this.registeredConstraints[constraint.name];
            // Check if the constraint has been registered
            if (constraintLogic) {
                try {
                    await constraintLogic.apply(context, constraint.parameters);
                } catch (error) {
                    throw new ConstraintError(
                        `Constraint violation on property '${context.propertyKey}' (${error.message})`,
                    );
                }
            }
        }
    }

    private registerConstraints() {
        for (const constraint of constraints) {
            this.registerConstraint(constraint);
        }
    }

    private getNetworkConstraints(propertyKey: string): NetworkConstraint[] {
        let constraints: NetworkConstraint[] = [];
        if (nftPropertiesConfig && nftPropertiesConfig[propertyKey] && nftPropertiesConfig[propertyKey].constraints) {
            constraints = nftPropertiesConfig[propertyKey].constraints.map(constraint => {
                if (typeof constraint === "string") {
                    return { name: constraint };
                }
                return constraint;
            });
        }
        return constraints;
    }
}
