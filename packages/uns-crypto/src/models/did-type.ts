export enum DIDTypes {
    INDIVIDUAL = 1,
    ORGANIZATION = 2,
    NETWORK = 3,
}

export type DIDType = keyof typeof DIDTypes;

const labels = (): string[] => {
    return Object.entries(DIDTypes)
        .filter(([_, v]) => typeof v === "number")
        .map(([k, _]) => k);
};

const codes = (): number[] => {
    return Object.entries(DIDTypes)
        .filter(([_, v]) => typeof v === "string")
        .map(([k, _]) => parseInt(k));
};

const fromCode = (code: number): DIDType => {
    return (DIDTypes[code] as DIDType) || undefined;
};

const fromLabel = (label: DIDType): number => {
    return DIDTypes[label];
};

export const DIDHelpers = {
    labels,
    codes,
    fromCode,
    fromLabel,
};
