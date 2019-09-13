export enum DIDTypes {
    INDIVIDUAL = 1,
    ORGANIZATION = 2,
    NETWORK = 3,
}

export type DIDType = keyof typeof DIDTypes;

function labels(): string[] {
    return Object.entries(DIDTypes)
        .filter(([_, v]) => typeof v === "number")
        .map(([k, _]) => k);
}

function codes(): number[] {
    return Object.entries(DIDTypes)
        .filter(([_, v]) => typeof v === "string")
        .map(([k, _]) => parseInt(k));
}

function fromCode(code: number): DIDType | undefined {
    return (DIDTypes[code] as DIDType) || undefined;
}

function fromLabel(label: DIDType): number {
    return DIDTypes[label];
}

export const DIDHelpers = {
    labels,
    codes,
    fromCode,
    fromLabel,
};
