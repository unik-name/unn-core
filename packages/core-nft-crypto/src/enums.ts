export enum NftTransactionType {
    NftTransfer = 0,
    NftUpdate = 1,
    NftMint = 2,
}

export const NftTransactionGroup = 1337; // first 1000 are reserved

export const NftTransactionStaticFees = {
    NftTransfer: 5000000000,
    NftUpdate: 5000000000,
    NftMint: 5000000000,
};
// TODO: to be integrated in netkwork config / milestones
export const getNftTransactionFees = (type: NftTransactionType): number => {
    switch (type) {
        case NftTransactionType.NftTransfer:
            return NftTransactionStaticFees.NftTransfer;
        case NftTransactionType.NftUpdate:
            return NftTransactionStaticFees.NftUpdate;
        case NftTransactionType.NftMint:
            return NftTransactionStaticFees.NftMint;
    }
};
