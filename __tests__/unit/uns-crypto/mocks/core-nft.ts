/* tslint:disable:no-empty */
export const coreNft = {
    getProperty: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    exists: jest.fn(),
    insertProperty: jest.fn(),
    insertProperties: jest.fn(),
    updateProperty: () => {},
    manageProperties: jest.fn(),
    getProperties: jest.fn(),
    findPropertyByKey: jest.fn(),
    deleteProperty: jest.fn(),
    getPropertyBatch: jest.fn(),
    constraints: {
        applyGenesisPropertyConstraint: _ => true,
        applyConstraints: _ => true,
        hasConstraint: _ => true,
    },
};
