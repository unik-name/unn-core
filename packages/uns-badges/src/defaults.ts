import { DIDTypes } from "@uns/crypto";

export const defaults = {};

export interface IProperyInfo {
    default?: string;
    defaultByType?: { [Didtype: string]: string };
}

export const systemProperties: Record<string, IProperyInfo> = {
    "Badges/Security/SecondPassphrase": {},
    "Badges/Security/Multisig": {
        default: "false",
    },
    "Badges/Security/BackupPassphrase": {
        default: "false",
    },
    "Badges/Rightness/Verified": {
        defaultByType: {
            [DIDTypes.ORGANIZATION]: "false",
        },
    },
    "Badges/Rightness/Everlasting": {
        defaultByType: {
            [DIDTypes.INDIVIDUAL]: "false",
            [DIDTypes.ORGANIZATION]: "false",
            [DIDTypes.NETWORK]: "true",
        },
    },
    "Badges/XPLevel": {
        default: "1",
    },
    "Badges/Trust/TrustIn": {
        default: "0",
    },
    "Badges/Trust/TrustOut": {
        default: "0",
    },
    "Badges/NP/Delegate": {
        default: "false",
    },
    "Badges/NP/StorageProvider": {
        default: "false",
    },
    "Badges/NP/UNIKIssuer": {
        default: "false",
    },
};
