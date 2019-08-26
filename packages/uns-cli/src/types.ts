export interface ChainTimestamp {
    epoch: number;
    unix: number;
    human: string;
}

export interface ChainMeta {
    height: string;
    timestamp: ChainTimestamp;
}

const individual = {
    code: 1,
};

const corporate = {
    code: 2,
};

export const UNIK_TYPES = { individual, corporate };

export const getUnikTypesList = () => {
    return Object.keys(UNIK_TYPES);
};
