export enum NftTransactionType {
    NftMint = 0,
    NftUpdate = 1,
    NftTransfer = 2,
}

export const NftTransactionGroup = 2000;

export const NftTransactionStaticFees = {
    NftTransfer: 10000000,
    NftUpdate: 10000000,
    NftMint: 10000000,
};
