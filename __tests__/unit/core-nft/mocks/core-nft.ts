export const nftManager = {
    getProperty: jest.fn(),
    constraints: {
        applyGenesisPropertyConstraint: _ => true,
        applyConstraints: _ => true,
        hasConstraint: _ => true,
    },
};
