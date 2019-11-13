interface IConstraintConfig {
    name: string;
    parameters?: any;
}

interface INftPropertyConstraintsConfig {
    genesis: boolean | undefined;
    constraints: Array<string | IConstraintConfig>;
}

interface INftConstraintsConfig {
    name: string;
    properties: {
        [key: string]: INftPropertyConstraintsConfig;
    };
}

interface IConstraintsConfig {
    [name: string]: INftConstraintsConfig;
}

export { IConstraintConfig, IConstraintsConfig, INftConstraintsConfig, INftPropertyConstraintsConfig };
