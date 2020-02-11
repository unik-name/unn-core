import { DIDTypes } from "@uns/crypto";

export const defaults = {};

export const badges = {
    SecondPassphrase: {
        category: "Security",
    },
    Multisig: {
        category: "Security",
        default: "false",
    },
    BackupPassphrase: {
        category: "Security",
        default: "false",
    },
    Verified: {
        category: "Rightness",
        types: {
            [DIDTypes.ORGANIZATION]: "false",
        },
    },
    Everlasting: {
        category: "Rightness",
        types: {
            [DIDTypes.INDIVIDUAL]: "false",
            [DIDTypes.ORGANIZATION]: "false",
            [DIDTypes.NETWORK]: "true",
        },
    },
    XPLevel: {
        // tslint:disable-next-line: no-null-keyword
        category: null,
        default: "1",
    },
    TrustIn: {
        category: "Trust",
        default: "0",
    },
    TrustOut: {
        category: "Trust",
        default: "0",
    },
    Delegate: {
        category: "NP",
        default: "false",
    },
    StorageProvider: {
        category: "NP",
        default: "false",
    },
    UNIKIssuer: {
        category: "NP",
        default: "false",
    },
    CosmicNonce: {
        category: "Authentication",
        default: "1",
    },
};
