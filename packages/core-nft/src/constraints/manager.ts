import { NFT } from "@arkecosystem/core-interfaces";
import { Interfaces } from "@arkecosystem/crypto";
import difference from "lodash.difference";
import {
    IConstraint,
    IConstraintApplicationContext,
    IConstraintConfig,
    IConstraintsConfig,
    INftConstraintsConfig,
    INftPropertyConstraintsConfig,
} from "../interfaces";
import { getCurrentNftAsset, getNftName } from "@uns/core-nft-crypto";
import { EnumerationConstraint, ImmutableConstraint, NumberConstraint, TypeConstraint } from "./constraint/";
import { ConstraintError } from "./error";

const genesisPropertiesReducer = (acc, current): string[] => {
    // current value is a property entry (a key and a value object containing genesis property)
    const [key, { genesis }] = current;
    // if genesis property of current nft property is true, add it to accumulator
    return genesis ? acc.concat(key) : acc;
};

export class ConstraintsManager {
    private registeredConstraints: { [_: string]: IConstraint } = {};

    constructor(private config: IConstraintsConfig, repository: NFT.INftsRepository) {
        this.buildAndRegisterConstraints(repository);
    }

    public registerConstraint(constraint: IConstraint) {
        this.registeredConstraints[constraint.name()] = constraint;
    }

    public async applyConstraints(transaction: Interfaces.ITransactionData) {
        const { properties } = getCurrentNftAsset(transaction);

        if (properties) {
            for (const [key, value] of Object.entries(properties)) {
                await this.applyPropertyConstraints({ key, value, transaction });
            }
        }
    }

    public applyGenesisPropertyConstraint(transaction: Interfaces.ITransactionData) {
        // Get constraint config of nft type modified in current transaction
        const nftConfig: INftConstraintsConfig = this.getNftConstraintsConfig(getNftName(transaction));
        if (nftConfig) {
            // Get list of genesis properties key
            const genesisProperties = Object.entries(nftConfig.properties || {}).reduce<string[]>(
                genesisPropertiesReducer,
                [],
            );

            // Get list of genesis properties set in current transaction
            const keys = Object.keys(getCurrentNftAsset(transaction).properties) || [];

            // compare lists, if there is more genesis properties in config then some are missing in current transaction
            if (difference(genesisProperties, keys).length > 0) {
                throw new ConstraintError("some genesis properties are missing");
            }
        } // else : no constraints, we can continue
    }

    private async applyPropertyConstraints(context: IConstraintApplicationContext) {
        // Get constraint config of nft type modified in current transaction
        const nftConfig: INftConstraintsConfig = this.getNftConstraintsConfig(getNftName(context.transaction));
        if (nftConfig) {
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

    private buildAndRegisterConstraints(repository: NFT.INftsRepository) {
        [
            new ImmutableConstraint(repository),
            new EnumerationConstraint(repository),
            new TypeConstraint(repository).registerTypeConstraint(new NumberConstraint(repository)),
        ].map(constraint => this.registerConstraint(constraint));
    }

    private getNftConstraintsConfig(nft: string): INftConstraintsConfig {
        return this.nftHasConstraints(nft) ? this.config[nft] : undefined;
    }

    private nftHasConstraints(nft: string): boolean {
        return this.config ? !!this.config[nft] : false;
    }

    private nftPropertyHasConstraints(config: INftConstraintsConfig, key: string): boolean {
        return config && config[key] && config[key].constraints;
    }

    private getNftPropertyConstraints(config: INftConstraintsConfig, propertyKey: string): IConstraintConfig[] {
        let constraints: IConstraintConfig[] = [];
        if (this.nftPropertyHasConstraints(config, propertyKey)) {
            const a: INftPropertyConstraintsConfig = config[propertyKey];
            constraints = a.constraints.map((constraint: string | IConstraintConfig) => {
                return typeof constraint === "string" ? { name: constraint } : constraint;
            });
        }
        return constraints;
    }
}
