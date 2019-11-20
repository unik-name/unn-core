export enum UnsTransactionType {
    UnsDiscloseExplicit = 0,
}

export const unsTransactionGroup = 1338; // first 1000 are reserved

export enum unsTransactionStaticFees {
    UnsDiscloseExplicit = "100000000",
}
// TODO: to be integrated in netkwork config / milestones
export const getUnsTransactionFees = (type: UnsTransactionType | number): number => {
    return 100000000;
};
