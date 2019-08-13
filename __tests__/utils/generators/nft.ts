import { HashAlgorithms } from "@arkecosystem/crypto";

export function generateNftIdentifier(): string {
    return HashAlgorithms.sha256(new Date().toISOString()).toString("hex");
}
