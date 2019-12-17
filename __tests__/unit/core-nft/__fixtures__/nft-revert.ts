// tslint:disable:no-null-keyword
import { Enums } from "@uns/core-nft-crypto";

export const NFT_NAME = "nftName";
export const testCases = [
    {
        scenario: "revert updated property",
        tokenId: "testCase1",
        transactions: [
            {
                type: Enums.NftTransactionType.NftMint,
                typeGroup: Enums.NftTransactionGroup,
                id: "dummy",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase1",
                            properties: {
                                propKey: "propVal",
                            },
                        },
                    },
                },
            },
            {
                type: Enums.NftTransactionType.NftUpdate,
                typeGroup: Enums.NftTransactionGroup,
                id: "toRevert",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase1",
                            properties: {
                                propKey: "newPropVal",
                            },
                        },
                    },
                },
            },
        ],
        finalProperties: {
            propKey: "newPropVal",
        },
        afterRevertProperties: {
            propKey: "propVal",
        },
    },
    {
        scenario: "revert added property",
        tokenId: "testCase2",
        transactions: [
            {
                type: Enums.NftTransactionType.NftMint,
                typeGroup: Enums.NftTransactionGroup,
                id: "dummy",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase2",
                            properties: {
                                propKey: "propVal",
                            },
                        },
                    },
                },
            },
            {
                type: Enums.NftTransactionType.NftUpdate,
                typeGroup: Enums.NftTransactionGroup,
                id: "toRevert",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase2",
                            properties: {
                                propKey2: "propVal2",
                            },
                        },
                    },
                },
            },
        ],
        finalProperties: {
            propKey: "propVal",
            propKey2: "propVal2",
        },
        afterRevertProperties: {
            propKey: "propVal",
        },
    },
    {
        scenario: "revert removed property",
        tokenId: "testCase3",
        transactions: [
            {
                type: Enums.NftTransactionType.NftMint,
                typeGroup: Enums.NftTransactionGroup,
                id: "dummy",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase3",
                            properties: {
                                propKey: "propVal",
                            },
                        },
                    },
                },
            },
            {
                type: Enums.NftTransactionType.NftUpdate,
                typeGroup: Enums.NftTransactionGroup,
                id: "toRevert",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase3",
                            properties: {
                                propKey: null,
                            },
                        },
                    },
                },
            },
        ],
        finalProperties: {},
        afterRevertProperties: {
            propKey: "propVal",
        },
    },
    {
        scenario: "revert deleted and recreated prop",
        tokenId: "testCase4",
        transactions: [
            {
                type: Enums.NftTransactionType.NftMint,
                typeGroup: Enums.NftTransactionGroup,
                id: "dummy",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase4",
                            properties: {
                                propKey: "propVal",
                            },
                        },
                    },
                },
            },
            {
                type: Enums.NftTransactionType.NftUpdate,
                typeGroup: Enums.NftTransactionGroup,
                id: "dummy",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase4",
                            properties: {
                                propKey2: "propVal2",
                                propKey: null,
                            },
                        },
                    },
                },
            },
            {
                type: Enums.NftTransactionType.NftUpdate,
                typeGroup: Enums.NftTransactionGroup,
                id: "toRevert",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase4",
                            properties: {
                                propKey: "newPropVal",
                            },
                        },
                    },
                },
            },
        ],
        finalProperties: {
            propKey: "newPropVal",
            propKey2: "propVal2",
        },
        afterRevertProperties: {
            propKey2: "propVal2",
        },
    },
    {
        scenario: "revert several properties added/updated/removed",
        tokenId: "testCase5",
        transactions: [
            {
                type: Enums.NftTransactionType.NftMint,
                typeGroup: Enums.NftTransactionGroup,
                id: "dummy",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase5",
                            properties: {
                                propKey: "propVal",
                                propKey2: "propVal2",
                            },
                        },
                    },
                },
            },
            {
                type: Enums.NftTransactionType.NftUpdate,
                typeGroup: Enums.NftTransactionGroup,
                id: "dummy",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase5",
                            properties: {
                                propKey2: null,
                                propKey3: "propVal3",
                                propKey4: "propVal4",
                            },
                        },
                    },
                },
            },
            {
                type: Enums.NftTransactionType.NftUpdate,
                typeGroup: Enums.NftTransactionGroup,
                id: "toRevert",
                asset: {
                    nft: {
                        [NFT_NAME]: {
                            tokenId: "testCase5",
                            properties: {
                                propKey: "newPropVal",
                                propKey3: "newPropVal3",
                            },
                        },
                    },
                },
            },
        ],
        finalProperties: {
            propKey: "newPropVal",
            propKey3: "newPropVal3",
            propKey4: "propVal4",
        },
        afterRevertProperties: {
            propKey: "propVal",
            propKey3: "propVal3",
            propKey4: "propVal4",
        },
    },
];
