interface IConstraintConfig {
    name: string;
    parameters?: any;
}

interface INftPropertyConstraintsConfig {
    genesis?: boolean;
    constraints?: Array<string | IConstraintConfig>;
}

interface INftConstraintsConfig {
    name: string;
    propertyKey?: {
        constraints?: IConstraintConfig[];
    };
    properties: {
        [key: string]: INftPropertyConstraintsConfig;
    };
}

interface IConstraintsConfig {
    [name: string]: INftConstraintsConfig;
}

export { IConstraintConfig, IConstraintsConfig, INftConstraintsConfig, INftPropertyConstraintsConfig };
