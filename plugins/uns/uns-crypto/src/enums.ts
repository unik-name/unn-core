export enum UnsTransactionType {
    UnsDiscloseExplicit = 0,
    UnsDelegateRegister = 1,
    UnsDelegateResign = 2,
    UnsCertifiedNftMint = 3,
    UnsCertifiedNftUpdate = 4,
    UnsVote = 5,
}

export const UnsTransactionGroup = 2001;

export const UnsTransactionStaticFees = {
    UnsDiscloseExplicit: 10000000,
    UnsDelegateRegister: 10000000,
    UnsDelegateResign: 10000000,
    UnsCertifiedNftMint: 100000000,
    UnsCertifiedNftUpdate: 10000000,
    UnsVoucherNftMint: 100000000,
    UnsVote: 100000000,
};

// Uns system properties

/* LifeCycle */
export const LIFE_CYCLE_PROPERTY_KEY = "LifeCycle/Status";
export enum LifeCycleGrades {
    ISSUED = 1,
    MINTED = 2,
    LIVE = 3,
    ABORTED = 4,
    EVERLASTING = 100,
}
