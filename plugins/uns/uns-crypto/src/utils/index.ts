import { Interfaces, Managers } from "@arkecosystem/crypto";
import { getCurrentNftAsset } from "@uns/core-nft-crypto";
import { LIFE_CYCLE_PROPERTY_KEY, LifeCycleGrades } from "../enums";
import { DIDHelpers, DIDTypes } from "../models";

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

export interface IUnsRewards {
    sender: number;
    foundation: number;
    forger: number;
}

export const getDidType = (asset: Interfaces.ITransactionAsset): DIDTypes => {
    const didType = getCurrentNftAsset(asset)?.properties?.type;
    if (!didType) {
        throw new Error(`Asset must contain did type.`);
    }
    return parseInt(didType);
};

export const getMintVoucherRewards = (asset: Interfaces.ITransactionAsset): IUnsRewards => {
    const didType = getCurrentNftAsset(asset)?.properties?.type;
    if (!didType) {
        throw new Error(`Asset must contain did type.`);
    }
    return getRewardsFromDidType(parseInt(didType));
};

/**
 * UNS Certified update helpers
 */

export const isAliveDemand = (asset: Interfaces.ITransactionAsset): boolean =>
    getCurrentNftAsset(asset).properties[LIFE_CYCLE_PROPERTY_KEY] === LifeCycleGrades.LIVE.toString();

export const getRewardsFromDidType = (didType: DIDTypes, height?: number): IUnsRewards =>
    Managers.configManager.getMilestone(height).voucherRewards[DIDHelpers.fromCode(didType).toLowerCase()];
