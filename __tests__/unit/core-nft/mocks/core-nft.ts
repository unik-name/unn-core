export const nftManager = {
    getProperty: jest.fn(),
    exists: jest.fn(),
    constraints: {
        applyGenesisPropertyConstraint: _ => true,
        applyConstraints: _ => true,
        hasConstraint: _ => true,
    },
};
