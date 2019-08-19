export const NETWORKS = {
    mainnet: {
        url: "",
        backend: "",
    },
    devnet: {
        url: "https://forger1.devnet.uns.network",
        backend: "https://us-central1-unik-name.cloudfunctions.net",
    },
    local: {
        url: "http://localhost:4003",
        backend: "https://us-central1-unik-name-integration.cloudfunctions.net",
        preset: "testnet",
    },
};

export const enum UNIK_TYPES {
    individual = 1,
    corporate = 2,
}
export const FINGERPRINT_API: string = "/api/v1/unik-name-fingerprint";
