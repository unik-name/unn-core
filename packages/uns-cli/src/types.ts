export interface ChainTimestamp {
    epoch: number;
    unix: number;
    human: string;
}

export interface ChainMeta {
    height: string;
    timestamp: ChainTimestamp;
}
