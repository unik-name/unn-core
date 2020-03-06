export enum UnsTransactionType {
    UnsDiscloseExplicit = 0,
    UnsDelegateRegister = 1,
    UnsDelegateResign = 2,
    UnsCertifiedNftMint = 3,
    UnsCertifiedNftUpdate = 4,
}

export const UnsTransactionGroup = 2001;

export const UnsTransactionStaticFees = {
    UnsDiscloseExplicit: 10000000,
    UnsDelegateRegister: 10000000,
    UnsDelegateResign: 10000000,
    UnsCertifiedNftMint: 10000000,
    UnsCertifiedNftUpdate: 10000000,
};
