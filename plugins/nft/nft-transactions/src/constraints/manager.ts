import { Interfaces } from "@arkecosystem/crypto";
import { getCurrentNftAsset, getNftName } from "@uns/core-nft-crypto";
import difference from "lodash.difference";
import {
    IConstraint,
    IConstraintApplicationContext,
    IConstraintConfig,
    IConstraintsConfig,
    INftConstraintsConfig,
    INftPropertyConstraintsConfig,
} from "../interfaces";
import {
    EnumerationConstraint,
    ImmutableConstraint,
    NumberConstraint,
    RegexConstraint,
    TypeConstraint,
} from "./constraint";
import { ConstraintError } from "./error";
import { genesisPropertiesReducer } from "./utils";

export class ConstraintsManager {
    private registeredConstraints: { [_: string]: IConstraint } = {};

    constructor(private config: IConstraintsConfig) {
        this.buildAndRegisterConstraints();
    }

    public registerConstraint(constraint: IConstraint) {
        this.registeredConstraints[constraint.name()] = constraint;
    }

    public async applyConstraints(transaction: Interfaces.ITransactionData) {
        const { properties } = getCurrentNftAsset(transaction.asset);

        if (properties) {
            for (const [key, value] of Object.entries(properties)) {
                await this.applyPropertyConstraints({ key, value, transaction });
            }
        }
    }

    public applyGenesisPropertyConstraint(transaction: Interfaces.ITransactionData) {
        // Get constraint config of nft type modified in current transaction
        const nftConfig: INftConstraintsConfig = this.getNftConstraintsConfig(getNftName(transaction.asset));
        if (nftConfig) {
            // Get list of genesis properties key
            const genesisProperties = Object.entries(nftConfig.properties || {}).reduce<string[]>(
                genesisPropertiesReducer,
                [],
            );

            // Get list of genesis properties set in current transaction
            const properties = getCurrentNftAsset(transaction.asset).properties;
            const keys = properties ? Object.keys(properties) : [];

            // compare lists, if there is more genesis properties in config then some are missing in current transaction
            if (difference(genesisProperties, keys).length > 0) {
                throw new ConstraintError("some genesis properties are missing");
            }
        } // else : no constraints, we can continue
    }

    private async applyPropertyConstraints(context: IConstraintApplicationContext) {
        // Get constraint config of nft type modified in current transaction
        const nftConfig: INftConstraintsConfig = this.getNftConstraintsConfig(getNftName(context.transaction.asset));
        if (nftConfig) {
            // Get property key constraints declared from configuration file
            for (const constraint of this.getNftPropertyKeyConstraints(nftConfig)) {
                // Get constraint logic instance
                const constraintLogic = this.registeredConstraints[constraint.name];
                // Check if the constraint has been registered
                if (constraintLogic) {
                    try {
                        await constraintLogic.apply(context, constraint.parameters);
                    } catch (error) {
                        throw new ConstraintError(
                            `Constraint violation on property '${context.key}' (${error.message})`,
                        );
                    }
                }
            }

            // Get constraints declared from configuration file
            for (const constraint of this.getNftPropertyConstraints(nftConfig, context.key)) {
                // Get constraint logic instance
                const constraintLogic = this.registeredConstraints[constraint.name];
                // Check if the constraint has been registered
                if (constraintLogic) {
                    try {
                        await constraintLogic.apply(context, constraint.parameters);
                    } catch (error) {
                        throw new ConstraintError(
                            `Constraint violation on property '${context.key}' (${error.message})`,
                        );
                    }
                }
            }
        } // else : no constraints, we can continue
    }

    private buildAndRegisterConstraints() {
        [
            new ImmutableConstraint(),
            new EnumerationConstraint(),
            new TypeConstraint().registerTypeConstraint(new NumberConstraint()),
            new RegexConstraint(),
        ].map(constraint => this.registerConstraint(constraint));
    }

    private getNftConstraintsConfig(nft: string): INftConstraintsConfig {
        return this.nftHasConstraints(nft) ? this.config[nft] : undefined;
    }

    private nftHasConstraints(nft: string): boolean {
        return this.config ? !!this.config[nft] : false;
    }

    private nftPropertyHasConstraints(config: INftConstraintsConfig, key: string): boolean {
        return config?.properties[key]?.constraints?.length > 0;
    }

    private nftPropertyHasKeyConstraints(config: INftConstraintsConfig): boolean {
        return config?.propertyKey?.constraints?.length > 0;
    }

    private getNftPropertyConstraints(config: INftConstraintsConfig, propertyKey: string): IConstraintConfig[] {
        let constraints: IConstraintConfig[] = [];
        if (this.nftPropertyHasConstraints(config, propertyKey)) {
            const a: INftPropertyConstraintsConfig = config.properties[propertyKey];
            constraints = a.constraints.map((constraint: string | IConstraintConfig) => {
                return typeof constraint === "string" ? { name: constraint } : constraint;
            });
        }
        return constraints;
    }

    private getNftPropertyKeyConstraints(config: INftConstraintsConfig): IConstraintConfig[] {
        let constraints: IConstraintConfig[] = [];
        if (this.nftPropertyHasKeyConstraints(config)) {
            constraints = config?.propertyKey?.constraints;
        }
        return constraints;
    }
}
