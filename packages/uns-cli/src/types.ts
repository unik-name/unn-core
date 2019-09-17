import { DIDHelpers, DIDTypes } from "@uns/ts-sdk";

export interface ChainTimestamp {
    epoch: number;
    unix: number;
    human: string;
}

export interface ChainMeta {
    height: string;
    timestamp: ChainTimestamp;
}

export const getUnikTypesList = () => {
    return DIDHelpers.labels().map(type => type.toLowerCase());
};

export const getTypeValue = (tokenType: string): string => {
    return `${DIDTypes[tokenType.toUpperCase()]}`;
};
