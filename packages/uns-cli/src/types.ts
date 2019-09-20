import { DIDHelpers, DIDTypes } from "@uns/ts-sdk";

export const getUnikTypesList = () => {
    return DIDHelpers.labels().map(type => type.toLowerCase());
};

export const getTypeValue = (tokenType: string): string => {
    return `${DIDTypes[tokenType.toUpperCase()]}`;
};
