import { Interfaces, Managers } from "@arkecosystem/crypto";
import { getCurrentNftAsset } from "@uns/core-nft-crypto";
import { DIDHelpers } from "../models";

/**
 * Code from http://www.typescriptlang.org/docs/handbook/mixins.html
 */
export const applyMixins = (derivedCtor: any, baseCtors: any[]) => {
    for (const baseCtor of baseCtors) {
        for (const name of Object.getOwnPropertyNames(baseCtor.prototype)) {
            Object.defineProperty(
                derivedCtor.prototype,
                name,
                Object.getOwnPropertyDescriptor(baseCtor.prototype, name),
            );
        }
    }
};

export const isUnikId = (username: string): boolean => /^[a-f0-9]{64}$/.test(username);

/**
 * UNS Certified mint helpers
 */
export const hasVoucher = (asset: Interfaces.ITransactionAsset): boolean =>
    !!getCurrentNftAsset(asset).properties?.UnikVoucherId;

export const getVoucherRewards = (asset: Interfaces.ITransactionAsset) => {
    const type: number = parseInt(getCurrentNftAsset(asset).properties.type);
    return Managers.configManager.getMilestone().voucherRewards[DIDHelpers.fromCode(type).toLowerCase()];
};
