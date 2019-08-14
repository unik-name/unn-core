import { app } from "@arkecosystem/core-container";
import difference from "lodash.difference";
import { Constraint, ConstraintError, constraints } from "../constraints";
import { ConstraintApplicationContext } from "../types";

interface NetworkConstraint {
    name: string;
    parameters: any;
}

export class ConstraintsManager {
    private registeredConstraints: { [_: string]: Constraint } = {};
    private nftPropertiesConfig: { [_: string]: { genesis: boolean; constraints: any } };

    constructor() {
        this.registerConstraints();
        this.nftPropertiesConfig = app.getConfig().get("network.nft.properties");
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

    public checkGenesisProperties(keys: string[]) {
        if (this.nftHasProperties()) {
            const genesisProperties = Object.entries(this.nftPropertiesConfig).reduce<string[]>(
                this.genesisPropertiesReducer,
                [],
            );
            if (difference(genesisProperties, keys).length > 0) {
                throw new ConstraintError("some genesis properties are missing");
            }
        }
    }

    private genesisPropertiesReducer(acc, current) {
        // current value is a property entry (a key and a value object containing genesis property)
        const [key, { genesis }] = current;
        // if genesis property of current nft property is true, add it to accumulator
        return genesis ? acc.concat(key) : acc;
    }

    private registerConstraints() {
        for (const constraint of constraints) {
            this.registerConstraint(constraint);
        }
    }

    private nftHasProperties(): boolean {
        return !!this.nftPropertiesConfig;
    }

    private propertyHasConstraints(key: string): boolean {
        return this.nftHasProperties() && this.nftPropertiesConfig[key] && this.nftPropertiesConfig[key].constraints;
    }

    private getNetworkConstraints(propertyKey: string): NetworkConstraint[] {
        let constraints: NetworkConstraint[] = [];
        if (this.propertyHasConstraints(propertyKey)) {
            constraints = this.nftPropertiesConfig[propertyKey].constraints.map(constraint => {
                if (typeof constraint === "string") {
                    return { name: constraint };
                }
                return constraint;
            });
        }
        return constraints;
    }
}
