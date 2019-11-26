jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                switch (name) {
                    case "core-nft":
                        return {
                            constraints: {
                                applyGenesisPropertyConstraint: _ => true,
                                applyConstraints: _ => true,
                            },
                        };
                    default:
                        return {};
                }
            },
        },
    };
});
