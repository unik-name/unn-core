export const NETWORKS = {
    devnet: {
        url: "https://forger1.devnet.uns.network",
        backend: "https://us-central1-unik-name.cloudfunctions.net",
    },
    local: {
        url: "http://localhost:4003",
        backend: "https://us-central1-unik-name-integration.cloudfunctions.net",
    },
};

export const FINGERPRINT_API: string = "/api/v1/unik-name-fingerprint";
